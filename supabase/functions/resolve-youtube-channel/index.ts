const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handle } = await req.json();
    if (!handle || typeof handle !== "string") {
      return new Response(
        JSON.stringify({ error: "handle is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean handle: accept @handle, youtube.com/@handle, full URLs
    let cleanHandle = handle.trim();
    // Extract from URL patterns
    const urlMatch = cleanHandle.match(/(?:youtube\.com\/)@([a-zA-Z0-9_.-]+)/);
    if (urlMatch) {
      cleanHandle = urlMatch[1];
    } else {
      // Remove leading @ if present
      cleanHandle = cleanHandle.replace(/^@/, "");
    }

    if (!cleanHandle || cleanHandle.length < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid handle format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use YouTube Data API search to find the channel by handle
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", `@${cleanHandle}`);
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", youtubeApiKey);

    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      console.error("YouTube API error:", searchData);
      return new Response(
        JSON.stringify({ error: "YouTube API error", details: searchData }),
        { status: searchRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!searchData.items?.length) {
      return new Response(
        JSON.stringify({ error: "channel_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channel = searchData.items[0];
    const channelId = channel.snippet.channelId;
    const channelTitle = channel.snippet.title;
    const channelThumbnail = channel.snippet.thumbnails?.default?.url || null;

    return new Response(
      JSON.stringify({
        channelId,
        channelTitle,
        channelThumbnail,
        handle: `@${cleanHandle}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
