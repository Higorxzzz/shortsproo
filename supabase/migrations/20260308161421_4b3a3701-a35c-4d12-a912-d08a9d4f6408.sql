
-- Add new columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS folder_id text;

-- Create drive_folders table
CREATE TABLE public.drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  folder_name text NOT NULL,
  drive_folder_id text NOT NULL,
  parent_folder_id text,
  folder_type text NOT NULL DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view drive folders" ON public.drive_folders FOR SELECT USING (is_team_member(auth.uid()));
CREATE POLICY "Team can insert drive folders" ON public.drive_folders FOR INSERT WITH CHECK (is_team_member(auth.uid()));
CREATE POLICY "Users can view own folders" ON public.drive_folders FOR SELECT USING (auth.uid() = user_id);

-- Create upload_logs table
CREATE TABLE public.upload_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view upload logs" ON public.upload_logs FOR SELECT USING (is_team_member(auth.uid()));
CREATE POLICY "Team can insert upload logs" ON public.upload_logs FOR INSERT WITH CHECK (is_team_member(auth.uid()));
CREATE POLICY "Admins can view all upload logs" ON public.upload_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
