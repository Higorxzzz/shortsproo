CREATE POLICY "Users can delete own completed raw videos"
ON public.raw_videos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'completed');