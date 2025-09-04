import type { APIRoute } from 'astro';

export const prerender = false;

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Content-Typeのチェックを追加
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    let requestData;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return new Response(JSON.stringify({ error: 'Empty request body' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      requestData = JSON.parse(text);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { url } = requestData;
    
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // URLの正規化
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch (urlError) {
      return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // メタデータを取得
    let response;
    try {
      response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache'
        },
        redirect: 'follow'
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Network error while fetching URL',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `HTTP ${response.status}: ${response.statusText}`,
        url: normalizedUrl 
      }), {
        status: 200, // リンクプレビューのエラーは200で返す
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    let html;
    try {
      html = await response.text();
    } catch (textError) {
      return new Response(JSON.stringify({ 
        error: 'Failed to read response content',
        details: textError instanceof Error ? textError.message : 'Unknown read error'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // HTMLからメタデータを抽出
    const linkPreview = extractMetadata(html, normalizedUrl);

    return new Response(JSON.stringify(linkPreview), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown server error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// OPTIONS リクエストをサポート
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};

function extractMetadata(html: string, url: string): LinkPreviewData {
  const urlObj = new URL(url);
  
  // 基本的なデータ
  const linkPreview: LinkPreviewData = {
    url,
    title: urlObj.hostname,
    description: '',
    siteName: urlObj.hostname,
    favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  };

  // タイトルを抽出
  const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
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
    // 相対URLを絶対URLに変換
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
  linkPreview.title = linkPreview.title.replace(/\s+/g, ' ').trim();
  linkPreview.description = linkPreview.description.replace(/\s+/g, ' ').trim();

  return linkPreview;
}

function extractMeta(html: string, property: string): string | null {
  // Open Graph形式
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  let match = html.match(ogRegex);
  
  if (!match) {
    // content属性が先の場合
    const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    match = html.match(reverseRegex);
  }
  
  return match ? match[1] : null;
}