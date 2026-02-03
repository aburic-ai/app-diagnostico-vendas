-- ============================================
-- MIGRATIONS COMPLETAS - CHAT IA + PROJEÇÕES (V2 - IDEMPOTENT)
-- ============================================
-- Criado em: 2026-02-03
-- Descrição: Tabelas para chat IA com OpenAI e projeções 30-60-90 personalizadas
-- Versão: 2 - Idempotente (pode ser executado múltiplas vezes)
-- Deploy: Executar este arquivo único no Supabase SQL Editor

-- ============================================
-- PARTE 1: CHAT IA COM OPENAI
-- ============================================

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
-- INDEXES - CHAT
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_day ON public.chat_conversations(event_day);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created ON public.chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- ============================================
-- RLS - CHAT
-- ============================================

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users manage own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins view all messages" ON public.chat_messages;

-- Create policies
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
-- COMMENTS - CHAT
-- ============================================

COMMENT ON TABLE public.chat_conversations IS 'Sessões de chat agrupadas por usuário e dia do evento';
COMMENT ON TABLE public.chat_messages IS 'Mensagens do chat IA salvas em tempo real durante o evento';
COMMENT ON COLUMN public.chat_messages.tokens_used IS 'Tokens usados pela OpenAI nesta resposta (para tracking de custo)';

-- ============================================
-- PARTE 2: PROJEÇÕES 30-60-90 PERSONALIZADAS
-- ============================================

-- ============================================
-- SCENARIO PROJECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.scenario_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  projection_30 JSONB NOT NULL,
  projection_60 JSONB NOT NULL,
  projection_90 JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  input_data JSONB,
  tokens_used INTEGER,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, version)
);

-- ============================================
-- INDEXES - PROJECTIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scenario_user ON public.scenario_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_generated ON public.scenario_projections(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_version ON public.scenario_projections(user_id, version DESC);

-- ============================================
-- RLS - PROJECTIONS
-- ============================================

ALTER TABLE public.scenario_projections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users view own projections" ON public.scenario_projections;
DROP POLICY IF EXISTS "Admins view all projections" ON public.scenario_projections;

-- Create policies
CREATE POLICY "Users view own projections"
  ON public.scenario_projections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all projections"
  ON public.scenario_projections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COMMENTS - PROJECTIONS
-- ============================================

COMMENT ON TABLE public.scenario_projections IS 'Projeções personalizadas 30-60-90 dias geradas via LLM ao final do evento';
COMMENT ON COLUMN public.scenario_projections.projection_30 IS 'Cenário de 30 dias: { days: 30, label, description, severity, financialImpact }';
COMMENT ON COLUMN public.scenario_projections.projection_60 IS 'Cenário de 60 dias: { days: 60, label, description, severity, financialImpact }';
COMMENT ON COLUMN public.scenario_projections.projection_90 IS 'Cenário de 90 dias: { days: 90, label, description, severity, financialImpact }';
COMMENT ON COLUMN public.scenario_projections.input_data IS 'Snapshot dos dados usados para gerar (survey + diagnóstico + chat summary)';
COMMENT ON COLUMN public.scenario_projections.tokens_used IS 'Tokens OpenAI usados na geração (para tracking de custo)';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT
  'MIGRATION COMPLETA!' as status,
  COUNT(*) FILTER (WHERE table_name = 'chat_conversations') as chat_conversations,
  COUNT(*) FILTER (WHERE table_name = 'chat_messages') as chat_messages,
  COUNT(*) FILTER (WHERE table_name = 'scenario_projections') as scenario_projections
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('chat_conversations', 'chat_messages', 'scenario_projections');
