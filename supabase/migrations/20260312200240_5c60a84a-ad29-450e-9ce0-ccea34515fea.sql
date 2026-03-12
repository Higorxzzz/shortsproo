
-- Dashboard banners table
CREATE TABLE public.dashboard_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  link_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banners" ON public.dashboard_banners
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active banners" ON public.dashboard_banners
  FOR SELECT TO authenticated
  USING (active = true);
