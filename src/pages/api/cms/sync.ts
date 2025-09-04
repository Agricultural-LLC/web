import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify the request is from an authenticated user
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract the Firebase ID token
    const idToken = authHeader.substring(7);

    // Verify Firebase ID token (simplified for now)
    // In production, you'd verify this with Firebase Admin SDK
    if (!idToken || idToken.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get GitHub repository dispatch URL
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = "Agricultural-LLC";
    const repoName = "web";

    if (!githubToken) {
      console.error("GITHUB_TOKEN environment variable not set");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Trigger GitHub Actions workflow via repository dispatch
    const dispatchUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`;

    const response = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "Agricultural-LLC-CMS/1.0",
      },
      body: JSON.stringify({
        event_type: "cms-update",
        client_payload: {
          timestamp: new Date().toISOString(),
          trigger: "cms",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to trigger sync",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.log("CMS sync triggered successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Content sync triggered",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Sync trigger error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: "CMS Sync API",
      endpoints: {
        "POST /api/cms/sync": "Trigger content sync from Firebase to GitHub",
      },
      status: "active",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
