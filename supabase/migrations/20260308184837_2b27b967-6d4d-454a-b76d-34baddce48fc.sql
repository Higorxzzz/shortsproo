
-- Create raw_videos table
CREATE TABLE public.raw_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  file_path text,
  file_name text,
  file_size bigint,
  status text NOT NULL DEFAULT 'editing',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raw_videos ENABLE ROW LEVEL SECURITY;

-- Users can insert their own raw videos
CREATE POLICY "Users can insert own raw videos"
  ON public.raw_videos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own raw videos
CREATE POLICY "Users can view own raw videos"
  ON public.raw_videos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Team can view all raw videos
CREATE POLICY "Team can view all raw videos"
  ON public.raw_videos FOR SELECT TO authenticated
  USING (is_team_member(auth.uid()));

-- Team can update raw videos (status, clear file_path)
CREATE POLICY "Team can update raw videos"
  ON public.raw_videos FOR UPDATE TO authenticated
  USING (is_team_member(auth.uid()));

-- Admins can delete raw videos
CREATE POLICY "Admins can delete raw videos"
  ON public.raw_videos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_raw_videos_updated_at
  BEFORE UPDATE ON public.raw_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for raw videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('raw-videos', 'raw-videos', false, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/x-matroska']);

-- Storage RLS: Users can upload to their own folder
CREATE POLICY "Users can upload raw videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'raw-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view own files
CREATE POLICY "Users can view own raw videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'raw-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Team can view all raw video files
CREATE POLICY "Team can view all raw video files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'raw-videos' AND is_team_member(auth.uid()));

-- Team can delete raw video files
CREATE POLICY "Team can delete raw video files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'raw-videos' AND is_team_member(auth.uid()));
