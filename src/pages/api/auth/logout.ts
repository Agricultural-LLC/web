import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  // Clear auth cookie
  cookies.delete('auth-token');

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};