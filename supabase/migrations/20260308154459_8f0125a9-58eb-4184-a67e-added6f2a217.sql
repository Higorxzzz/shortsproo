
-- Comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Helper: check if user has any team role
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'manager', 'editor')
  )
$$;

-- Comments policies
CREATE POLICY "Team can select comments" ON public.comments FOR SELECT TO authenticated USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team can insert comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (public.is_team_member(auth.uid()) AND auth.uid() = author_id);
CREATE POLICY "Team can delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Tasks: manager/editor access
CREATE POLICY "Managers can select all tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can select all tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Managers can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Managers can insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- Videos: manager/editor access
CREATE POLICY "Managers can insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can insert videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Managers can select all videos" ON public.videos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can select all videos" ON public.videos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- Production logs: manager/editor access
CREATE POLICY "Managers can insert logs" ON public.production_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can insert logs" ON public.production_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'editor'));

-- Profiles: manager/editor read access
CREATE POLICY "Managers can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Editors can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'editor'));

-- User roles: admin management
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
