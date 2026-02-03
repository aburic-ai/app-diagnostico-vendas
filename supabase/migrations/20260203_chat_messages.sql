-- ============================================
-- CHAT MESSAGES & CONVERSATIONS TABLES
-- ============================================
-- Criado em: 2026-02-03
-- Proposito: Armazenar mensagens do chat IA em tempo real

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================
-- Agrupa mensagens em sessões (um chat aberto = uma conversa)

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_day INTEGER NOT NULL CHECK (event_day IN (1, 2)),
  module_id INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
-- Armazena cada mensagem (user + assistant)

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  event_day INTEGER CHECK (event_day IN (1, 2)),
  module_id INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user
  ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_day
  ON public.chat_conversations(event_day);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created
  ON public.chat_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user
  ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created
  ON public.chat_messages(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view only their own conversations
CREATE POLICY "Users view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own conversations
CREATE POLICY "Users manage own conversations"
  ON public.chat_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view only their own messages
CREATE POLICY "Users view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins view all messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.chat_conversations IS
  'Sessões de chat agrupadas por usuário e dia do evento';

COMMENT ON TABLE public.chat_messages IS
  'Mensagens do chat IA salvas em tempo real durante o evento';

COMMENT ON COLUMN public.chat_messages.tokens_used IS
  'Tokens usados pela OpenAI nesta resposta (para tracking de custo)';
