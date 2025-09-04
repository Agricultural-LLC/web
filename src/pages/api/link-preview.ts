import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const body = await request.json();
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // In development, use Firebase Functions. In production, try direct implementation
    const isDev = import.meta.env.DEV;
    
    if (!isDev) {
      // Production: Forward to Firebase Function
      const firebaseFunctionUrl = 'https://us-central1-agricultural-llc.cloudfunctions.net/api/link-preview';
      
      const response = await fetch(firebaseFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://agricultural-llc.web.app'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Firebase Function responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Development: Simple direct implementation
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Validate URL
    try {
      new URL(normalizedUrl);
    } catch (urlError) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch the page
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Agricultural-LLC-LinkPreview/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: `HTTP ${response.status}: ${response.statusText}`,
        url: normalizedUrl 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    const linkPreview = extractMetadata(html, normalizedUrl);

    return new Response(JSON.stringify(linkPreview), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Link preview API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch link preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Extract metadata from HTML (simplified version of Firebase Function logic)
function extractMetadata(html: string, url: string) {
  const urlObj = new URL(url);
  
  const linkPreview = {
    url,
    title: urlObj.hostname,
    description: '',
    siteName: urlObj.hostname,
    favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    linkPreview.title = titleMatch[1].trim();
  }

  // Extract Open Graph metadata
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  const ogImage = extractMeta(html, 'og:image');
  const ogSiteName = extractMeta(html, 'og:site_name');

  // Extract Twitter Card metadata
  const twitterTitle = extractMeta(html, 'twitter:title');
  const twitterDescription = extractMeta(html, 'twitter:description');
  const twitterImage = extractMeta(html, 'twitter:image');

  // Extract regular meta description
  const description = extractMeta(html, 'description');

  // Set values with priority
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

  // Clean up text
  linkPreview.title = linkPreview.title.replace(/\s+/g, ' ').trim();
  linkPreview.description = linkPreview.description.replace(/\s+/g, ' ').trim();

  return linkPreview;
}

function extractMeta(html: string, property: string): string | null {
  // Open Graph format
  const ogRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  let match = html.match(ogRegex);
  
  if (!match) {
    // content attribute first
    const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    match = html.match(reverseRegex);
  }
  
  return match ? match[1] : null;
}