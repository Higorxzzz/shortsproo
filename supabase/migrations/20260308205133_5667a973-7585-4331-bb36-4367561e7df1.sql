
CREATE POLICY "Admins can delete support messages"
ON public.support_messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete support chats"
ON public.support_chats FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
