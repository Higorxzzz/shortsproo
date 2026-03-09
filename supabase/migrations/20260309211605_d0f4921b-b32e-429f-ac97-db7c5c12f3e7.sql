
INSERT INTO public.platform_settings (key, value) VALUES
  ('landing_enabled', 'true'),
  ('landing_config', '{"sections":{"hero":true,"stats":true,"howItWorks":true,"services":true,"testimonials":true,"faq":true,"cta":true},"content":{}}')
ON CONFLICT (key) DO NOTHING;
