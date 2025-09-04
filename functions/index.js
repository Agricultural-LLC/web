const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");

// Initialize Firebase Admin
initializeApp();

// CORS設定: 許可するドメインを定義
const getAllowedOrigin = (origin) => {
  const allowedOrigins = [
    'https://agricultural-llc.web.app',
    'https://agricultural-llc.github.io',
    'http://nogyodata.com',
    'https://nogyodata.com',
    'http://localhost:4321'  // 開発環境用
  ];
  
  return allowedOrigins.includes(origin || '') ? origin : 'https://agricultural-llc.web.app';
};

// CORS ヘッダーを設定
const setCorsHeaders = (res, origin) => {
  const allowedOrigin = getAllowedOrigin(origin);
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Link Preview API
exports.api = onRequest({cors: false}, async (req, res) => {
  const origin = req.get('Origin');
  setCorsHeaders(res, origin);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  // Route API requests
  if (req.path.startsWith('/link-preview')) {
    return handleLinkPreview(req, res);
  } else if (req.path.startsWith('/cms/sync')) {
    return handleCmsSync(req, res);
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
});

// Link Preview Handler
const handleLinkPreview = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Invalid URL provided' });
      return;
    }

    // URLの正規化とセキュリティ検証
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      const urlObj = new URL(normalizedUrl);
      
      // セキュリティ: プライベートIPアドレスやlocalhostをブロック
      const hostname = urlObj.hostname.toLowerCase();
      const blockedHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '10.',
        '172.',
        '192.168.',
        '::1',
        'fc00:',
        'fd00:',
        'fe80:'
      ];
      
      if (blockedHosts.some(blocked => hostname.includes(blocked) || hostname.startsWith(blocked))) {
        res.status(403).json({ error: 'Access to private networks is not allowed' });
        return;
      }

      // HTTPSのみ許可（HTTP リダイレクトは許可）
      if (urlObj.protocol !== 'https:' && urlObj.protocol !== 'http:') {
        res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
        return;
      }
    } catch (urlError) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // メタデータを取得（タイムアウト付き）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    try {
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Agricultural-LLC-LinkPreview/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        res.status(200).json({ 
          error: `HTTP ${response.status}: ${response.statusText}`,
          url: normalizedUrl 
        });
        return;
      }

      const html = await response.text();
      const linkPreview = extractMetadata(html, normalizedUrl);

      res.status(200).json(linkPreview);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      logger.error('Fetch error:', fetchError);
      res.status(500).json({ 
        error: 'Network error while fetching URL',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      });
    }

  } catch (error) {
    logger.error('Link preview error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown server error'
    });
  }
};

// CMS Sync Handler
const handleCmsSync = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify the request is from an authenticated user
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract the Firebase ID token
    const idToken = authHeader.substring(7);

    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      
      if (!decodedToken.email) {
        res.status(403).json({ error: 'User email required' });
        return;
      }

      logger.info(`CMS sync requested by: ${decodedToken.email}`);
    } catch (error) {
      logger.error('Token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // GitHub workflow trigger logic would go here
    res.status(200).json({
      success: true,
      message: 'Content sync triggered',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Sync trigger error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Extract metadata from HTML
const extractMetadata = (html, url) => {
  const urlObj = new URL(url);
  
  const linkPreview = {
    url,
    title: urlObj.hostname,
    description: '',
    siteName: urlObj.hostname,
    favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  };

  // タイトルを抽出
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    linkPreview.title = titleMatch[1].trim();
  }

  // Open Graphメタデータを抽出
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  const ogImage = extractMeta(html, 'og:image');
  const ogSiteName = extractMeta(html, 'og:site_name');

  // Twitter Cardメタデータを抽出
  const twitterTitle = extractMeta(html, 'twitter:title');
  const twitterDescription = extractMeta(html, 'twitter:description');
  const twitterImage = extractMeta(html, 'twitter:image');

  // 通常のメタデータを抽出
  const description = extractMeta(html, 'description');

  // 優先順位に従って設定
  if (ogTitle || twitterTitle) {
    linkPreview.title = ogTitle || twitterTitle || linkPreview.title;
  }

  if (ogDescription || twitterDescription || description) {
    linkPreview.description = ogDescription || twitterDescription || description || '';
  }

  if (ogImage || twitterImage) {
    const imageUrl = ogImage || twitterImage;
    if (imageUrl) {
      linkPreview.image = imageUrl.startsWith('http') 
        ? imageUrl 
        : new URL(imageUrl, url).href;
    }
  }

  if (ogSiteName) {
    linkPreview.siteName = ogSiteName;
  }

  // タイトルの清浄化
  linkPreview.title = linkPreview.title.replace(/\\s+/g, ' ').trim();
  linkPreview.description = linkPreview.description.replace(/\\s+/g, ' ').trim();

  return linkPreview;
};

const extractMeta = (html, property) => {
  // Open Graph形式
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  let match = html.match(ogRegex);
  
  if (!match) {
    // content属性が先の場合
    const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    match = html.match(reverseRegex);
  }
  
  return match ? match[1] : null;
};