-- ============================================
-- MIGRATIONS COMPLETAS - CHAT IA + PROJEÇÕES
-- ============================================
-- Criado em: 2026-02-03
-- Descrição: Tabelas para chat IA com OpenAI e projeções 30-60-90 personalizadas
-- Deploy: Executar este arquivo único no Supabase SQL Editor

-- ============================================
-- PARTE 1: CHAT IA COM OPENAI
-- ============================================

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
-- INDEXES - CHAT
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
-- RLS POLICIES - CHAT
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
-- COMMENTS - CHAT
-- ============================================

COMMENT ON TABLE public.chat_conversations IS
  'Sessões de chat agrupadas por usuário e dia do evento';

COMMENT ON TABLE public.chat_messages IS
  'Mensagens do chat IA salvas em tempo real durante o evento';

COMMENT ON COLUMN public.chat_messages.tokens_used IS
  'Tokens usados pela OpenAI nesta resposta (para tracking de custo)';

-- ============================================
-- PARTE 2: PROJEÇÕES 30-60-90 PERSONALIZADAS
-- ============================================

-- ============================================
-- SCENARIO PROJECTIONS TABLE
-- ============================================
-- Cacheia projeções personalizadas geradas via LLM

CREATE TABLE IF NOT EXISTS public.scenario_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Projeções geradas (3 cenários)
  projection_30 JSONB NOT NULL,  -- { days, label, description, severity, financialImpact }
  projection_60 JSONB NOT NULL,
  projection_90 JSONB NOT NULL,

  -- Metadata da geração
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  input_data JSONB,              -- Snapshot dos dados usados (survey + IMPACT + chat)
  tokens_used INTEGER,

  -- Versionamento (permite regenerar se necessário)
  version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, version)
);

-- ============================================
-- INDEXES - PROJECTIONS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scenario_user
  ON public.scenario_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_generated
  ON public.scenario_projections(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_version
  ON public.scenario_projections(user_id, version DESC);

-- ============================================
-- RLS POLICIES - PROJECTIONS
-- ============================================

ALTER TABLE public.scenario_projections ENABLE ROW LEVEL SECURITY;

-- Users view only their own projections
CREATE POLICY "Users view own projections"
  ON public.scenario_projections FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend can insert (via service role from Edge Function)
-- No UPDATE allowed (projections are immutable, create new version instead)

-- Admins view all
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

COMMENT ON TABLE public.scenario_projections IS
  'Projeções personalizadas 30-60-90 dias geradas via LLM ao final do evento';

COMMENT ON COLUMN public.scenario_projections.projection_30 IS
  'Cenário de 30 dias: { days: 30, label, description, severity, financialImpact }';

COMMENT ON COLUMN public.scenario_projections.projection_60 IS
  'Cenário de 60 dias: { days: 60, label, description, severity, financialImpact }';

COMMENT ON COLUMN public.scenario_projections.projection_90 IS
  'Cenário de 90 dias: { days: 90, label, description, severity, financialImpact }';

COMMENT ON COLUMN public.scenario_projections.input_data IS
  'Snapshot dos dados usados para gerar (survey + diagnóstico + chat summary)';

COMMENT ON COLUMN public.scenario_projections.tokens_used IS
  'Tokens OpenAI usados na geração (para tracking de custo)';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

-- Verificar tabelas criadas
SELECT
  'MIGRATION COMPLETA!' as status,
  COUNT(*) FILTER (WHERE table_name = 'chat_conversations') as chat_conversations,
  COUNT(*) FILTER (WHERE table_name = 'chat_messages') as chat_messages,
  COUNT(*) FILTER (WHERE table_name = 'scenario_projections') as scenario_projections
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('chat_conversations', 'chat_messages', 'scenario_projections');
