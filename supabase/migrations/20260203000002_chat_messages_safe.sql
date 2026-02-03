-- ============================================
-- CHAT MESSAGES & CONVERSATIONS TABLES (SAFE)
-- ============================================
-- Versão SAFE: Não dá erro se já existir
-- Criado em: 2026-02-03

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================

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
-- INDEXES (IF NOT EXISTS)
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
-- RLS POLICIES (DROP IF EXISTS + CREATE)
-- ============================================

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users manage own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins view all messages" ON public.chat_messages;

-- Recreate policies
CREATE POLICY "Users view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own conversations"
  ON public.chat_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
