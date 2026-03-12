
-- Create a public bucket for branding assets (logo, favicon)
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read branding files
CREATE POLICY "Anyone can view branding files" ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

-- Only admins can upload/update/delete branding files
CREATE POLICY "Admins can manage branding files" ON storage.objects
  FOR ALL USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'));
