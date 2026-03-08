
-- Tasks table: auto-generated daily tasks per user based on their plan
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  task_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'completed')),
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_date, task_number)
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can select all tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Users can view own tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Production logs for audit trail
CREATE TABLE public.production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL,
  action text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select all logs" ON public.production_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert logs" ON public.production_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to generate daily tasks for all active users
CREATE OR REPLACE FUNCTION public.generate_daily_tasks(target_date date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tasks_created integer := 0;
  user_record RECORD;
BEGIN
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
      
      IF FOUND THEN
        tasks_created := tasks_created + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN tasks_created;
END;
$$;

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
