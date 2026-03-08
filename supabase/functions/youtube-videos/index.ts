import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MINUTES = 360;
const DAILY_QUOTA_LIMIT = 10000; // YouTube default

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelId, forceRefresh } = await req.json();
    if (!channelId) {
      return new Response(JSON.stringify({ error: "channelId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache
    if (!forceRefresh) {
      const { data: meta } = await supabase
        .from("youtube_cache_metadata")
        .select("*")
        .eq("channel_id", channelId)
        .single();

      if (meta) {
        const age = (Date.now() - new Date(meta.last_fetched_at).getTime()) / 60000;
        if (age < CACHE_TTL_MINUTES) {
          const { data: cached } = await supabase
            .from("youtube_videos_cache")
            .select("*")
            .eq("channel_id", channelId)
            .order("published_at", { ascending: false });

          return new Response(
            JSON.stringify({ videos: cached || [], fromCache: true, stale: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let quotaUsed = 0;

    // Step 1: Get uploads playlist ID (1 quota unit)
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
    );
    const channelData = await channelRes.json();
    quotaUsed += 1;

    if (!channelRes.ok || !channelData.items?.length) {
      // Log quota even on failure
      await supabase.from("youtube_quota_log").insert({
        channel_id: channelId,
        units_used: quotaUsed,
        request_type: "refresh_failed",
      });

      const { data: staleCache } = await supabase
        .from("youtube_videos_cache")
        .select("*")
        .eq("channel_id", channelId)
        .order("published_at", { ascending: false });

      if (staleCache?.length) {
        return new Response(
          JSON.stringify({ videos: staleCache, fromCache: true, stale: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Channel not found or API error", details: channelData }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Step 2: Fetch playlist items (1 quota unit per page, up to 3 pages)
    let allVideos: any[] = [];
    let nextPageToken: string | undefined;
    let pages = 0;

    while (pages < 3) {
      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("playlistId", uploadsPlaylistId);
      url.searchParams.set("maxResults", "50");
      url.searchParams.set("key", youtubeApiKey);
      if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

      const res = await fetch(url.toString());
      const data = await res.json();
      quotaUsed += 1;

      if (!res.ok) {
        if (res.status === 403) {
          // Log quota on 403
          await supabase.from("youtube_quota_log").insert({
            channel_id: channelId,
            units_used: quotaUsed,
            request_type: "refresh_quota_exceeded",
          });

          const { data: staleCache } = await supabase
            .from("youtube_videos_cache")
            .select("*")
            .eq("channel_id", channelId)
            .order("published_at", { ascending: false });

          if (staleCache?.length) {
            return new Response(
              JSON.stringify({ videos: staleCache, fromCache: true, stale: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        break;
      }

      const items = (data.items || []).filter(
        (item: any) =>
          item.snippet?.title !== "Deleted video" &&
          item.snippet?.title !== "Private video"
      );

      for (const item of items) {
        const snippet = item.snippet;
        const thumbs = snippet.thumbnails || {};
        const thumbnail =
          thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url;

        allVideos.push({
          channel_id: channelId,
          video_id: snippet.resourceId.videoId,
          video_title: snippet.title,
          video_description: snippet.description || null,
          thumbnail_url: thumbnail || null,
          published_at: snippet.publishedAt || null,
        });
      }

      nextPageToken = data.nextPageToken;
      if (!nextPageToken) break;
      pages++;
    }

    // Sort by published_at desc
    allVideos.sort(
      (a, b) =>
        new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );

    // Update cache
    await supabase.from("youtube_videos_cache").delete().eq("channel_id", channelId);
    if (allVideos.length > 0) {
      await supabase.from("youtube_videos_cache").insert(allVideos);
    }
    await supabase.from("youtube_cache_metadata").upsert(
      {
        channel_id: channelId,
        last_fetched_at: new Date().toISOString(),
        video_count: allVideos.length,
      },
      { onConflict: "channel_id" }
    );

    // Log quota usage
    await supabase.from("youtube_quota_log").insert({
      channel_id: channelId,
      units_used: quotaUsed,
      request_type: "refresh",
    });

    return new Response(
      JSON.stringify({ videos: allVideos, fromCache: false, stale: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
