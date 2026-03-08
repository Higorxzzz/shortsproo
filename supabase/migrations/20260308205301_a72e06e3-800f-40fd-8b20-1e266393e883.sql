
CREATE TABLE public.support_quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  auto_response text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quick replies"
ON public.support_quick_replies FOR SELECT
TO authenticated
USING (active = true);

CREATE POLICY "Admins can manage quick replies"
ON public.support_quick_replies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
