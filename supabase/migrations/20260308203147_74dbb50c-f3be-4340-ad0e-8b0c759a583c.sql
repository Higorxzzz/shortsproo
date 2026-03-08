
-- Support chats table
CREATE TABLE public.support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats" ON public.support_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chats" ON public.support_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can view all chats" ON public.support_chats FOR SELECT USING (is_team_member(auth.uid()));
CREATE POLICY "Team can update chats" ON public.support_chats FOR UPDATE USING (is_team_member(auth.uid()));

-- Support messages table
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.support_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages" ON public.support_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.support_chats WHERE id = chat_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own chat messages" ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.support_chats WHERE id = chat_id AND user_id = auth.uid()));
CREATE POLICY "Team can view all messages" ON public.support_messages FOR SELECT USING (is_team_member(auth.uid()));
CREATE POLICY "Team can insert messages" ON public.support_messages FOR INSERT WITH CHECK (is_team_member(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chats;
