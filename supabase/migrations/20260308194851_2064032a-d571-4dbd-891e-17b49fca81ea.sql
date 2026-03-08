-- YouTube API quota usage tracking
CREATE TABLE public.youtube_quota_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL,
  user_id text,
  units_used integer NOT NULL DEFAULT 0,
  request_type text NOT NULL DEFAULT 'refresh',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.youtube_quota_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read quota logs
CREATE POLICY "Admins can read quota logs" ON public.youtube_quota_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service can manage quota logs" ON public.youtube_quota_log FOR ALL TO service_role USING (true) WITH CHECK (true);