import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/auth';
import { githubCMS, type PostFrontmatter } from '@/lib/github';

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    AuthService.requireAuth(context);

    const posts = await githubCMS.getAllPosts();
    
    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    AuthService.requireAuth(context);

    const body = await context.request.json();
    const { slug, frontmatter, content } = body;

    if (!slug || !frontmatter || !content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return new Response(JSON.stringify({ 
        error: 'Slug must contain only lowercase letters, numbers, and hyphens' 
      }), {
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

    const post = await githubCMS.createPost(slug, postFrontmatter, content);
    
    return new Response(JSON.stringify({ success: true, post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create post error:', error);
    
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