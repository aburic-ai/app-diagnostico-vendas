-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
-- Armazena todas as mensagens do chat IA durante o evento
-- Salvamento em tempo real (a cada mensagem)

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,        -- Agrupa mensagens por sessão
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER,                  -- Tracking de custo
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata para análise posterior
  event_day INTEGER,                    -- Dia 1 ou 2
  module_id INTEGER                     -- Qual módulo estava ativo
);

-- ============================================
-- CHAT CONVERSATIONS TABLE
-- ============================================
-- Agrupa mensagens em sessões
-- Uma sessão = um chat aberto durante o evento

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_day INTEGER NOT NULL,
  module_id INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0   -- Custo total da sessão
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_day ON public.chat_conversations(event_day);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view only their own messages
CREATE POLICY "Users view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view only their own conversations
CREATE POLICY "Users view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own conversations
CREATE POLICY "Users manage own conversations"
  ON public.chat_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins view all messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.chat_messages IS 'Mensagens do chat IA durante o evento';
COMMENT ON TABLE public.chat_conversations IS 'Sessões de chat agrupadas por usuário e dia';
