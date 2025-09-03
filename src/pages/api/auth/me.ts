import type { APIRoute } from 'astro';
import { AuthService } from '@/lib/auth';

export const GET: APIRoute = async (context) => {
  try {
    const token = AuthService.getTokenFromRequest(context);
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      user: {
        id: token.userId,
        username: token.username,
        role: token.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};