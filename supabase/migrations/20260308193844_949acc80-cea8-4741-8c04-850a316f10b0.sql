-- YouTube videos cache table
CREATE TABLE public.youtube_videos_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  video_id text NOT NULL,
  video_title text NOT NULL,
  video_description text,
  thumbnail_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, video_id)
);

-- YouTube cache metadata table
CREATE TABLE public.youtube_cache_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  last_fetched_at timestamptz NOT NULL DEFAULT now(),
  video_count integer NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE public.youtube_videos_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache
CREATE POLICY "Anyone can read youtube cache" ON public.youtube_videos_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read youtube metadata" ON public.youtube_cache_metadata FOR SELECT TO authenticated USING (true);

-- Service role manages writes
CREATE POLICY "Service can manage youtube cache" ON public.youtube_videos_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service can manage youtube metadata" ON public.youtube_cache_metadata FOR ALL TO service_role USING (true) WITH CHECK (true);