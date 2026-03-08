
-- Add file columns to support_messages
ALTER TABLE public.support_messages
  ADD COLUMN file_url text,
  ADD COLUMN file_type text;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users can upload support files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

CREATE POLICY "Anyone can view support files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'support-attachments');
