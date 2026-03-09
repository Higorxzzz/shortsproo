
-- Remove default so trial doesn't auto-activate
ALTER TABLE public.profiles ALTER COLUMN trial_start SET DEFAULT NULL;
-- Clear trial_start for existing users who haven't explicitly activated
UPDATE public.profiles SET trial_start = NULL WHERE plan_id IS NULL;
