
-- Platform settings table (key-value)
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.platform_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default free trial settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('free_trial_days', '3'),
  ('free_trial_videos_per_day', '1');

-- Add trial_start to profiles
ALTER TABLE public.profiles ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update generate_daily_tasks to include trial users
CREATE OR REPLACE FUNCTION public.generate_daily_tasks(target_date date DEFAULT CURRENT_DATE)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tasks_created integer := 0;
  user_record RECORD;
  trial_days_setting integer;
  trial_videos_setting integer;
BEGIN
  -- Get trial settings
  SELECT COALESCE((SELECT value::integer FROM platform_settings WHERE key = 'free_trial_days'), 3) INTO trial_days_setting;
  SELECT COALESCE((SELECT value::integer FROM platform_settings WHERE key = 'free_trial_videos_per_day'), 1) INTO trial_videos_setting;

  -- Users with plans
  FOR user_record IN
    SELECT p.id as user_id, pl.shorts_per_day
    FROM profiles p
    JOIN plans pl ON p.plan_id = pl.id
    WHERE p.suspended IS NOT TRUE
      AND p.plan_id IS NOT NULL
  LOOP
    FOR i IN 1..user_record.shorts_per_day LOOP
      INSERT INTO tasks (user_id, task_date, task_number)
      VALUES (user_record.user_id, target_date, i)
      ON CONFLICT (user_id, task_date, task_number) DO NOTHING;
      IF FOUND THEN tasks_created := tasks_created + 1; END IF;
    END LOOP;
  END LOOP;

  -- Trial users (no plan, within trial period)
  FOR user_record IN
    SELECT p.id as user_id
    FROM profiles p
    WHERE p.suspended IS NOT TRUE
      AND p.plan_id IS NULL
      AND p.trial_start IS NOT NULL
      AND (p.trial_start + (trial_days_setting || ' days')::interval) >= target_date::timestamp
  LOOP
    FOR i IN 1..trial_videos_setting LOOP
      INSERT INTO tasks (user_id, task_date, task_number)
      VALUES (user_record.user_id, target_date, i)
      ON CONFLICT (user_id, task_date, task_number) DO NOTHING;
      IF FOUND THEN tasks_created := tasks_created + 1; END IF;
    END LOOP;
  END LOOP;

  RETURN tasks_created;
END;
$function$;
