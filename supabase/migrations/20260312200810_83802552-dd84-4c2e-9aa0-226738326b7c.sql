-- Allow public reads of platform settings so landing visibility works before login
CREATE POLICY "Public can read platform settings"
ON public.platform_settings
FOR SELECT
TO public
USING (true);