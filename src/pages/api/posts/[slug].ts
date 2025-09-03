import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/auth';
import { githubCMS, type PostFrontmatter } from '@/lib/github';

export const GET: APIRoute = async (context) => {
  try {
    const { slug } = context.params;
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const post = await githubCMS.getPost(slug);
    
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get post error:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    // Check authentication
    AuthService.requireAuth(context);

    const { slug } = context.params;
    const body = await context.request.json();
    const { frontmatter, content, sha } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!frontmatter || !content || !sha) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate frontmatter
    const postFrontmatter: PostFrontmatter = {
      title: frontmatter.title || '',
      description: frontmatter.description || '',
      date: frontmatter.date || new Date().toISOString(),
      authors: Array.isArray(frontmatter.authors) ? frontmatter.authors : [],
      categories: Array.isArray(frontmatter.categories) ? frontmatter.categories : [],
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      draft: Boolean(frontmatter.draft),
    };

    if (!postFrontmatter.title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const post = await githubCMS.updatePost(slug, postFrontmatter, content, sha);
    
    return new Response(JSON.stringify({ success: true, post }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update post error:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    AuthService.requireAuth(context);

    const { slug } = context.params;
    const body = await context.request.json();
    const { sha } = body;

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!sha) {
      return new Response(JSON.stringify({ error: 'SHA is required for deletion' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await githubCMS.deletePost(slug, sha);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete post error:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};