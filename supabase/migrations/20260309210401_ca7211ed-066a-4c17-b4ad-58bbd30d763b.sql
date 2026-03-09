
INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_name', 'ShortsPro'),
  ('primary_color', '#6C3AED')
ON CONFLICT (key) DO NOTHING;
