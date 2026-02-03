-- ============================================
-- SCENARIO PROJECTIONS TABLE
-- ============================================
-- Criado em: 2026-02-03
-- Proposito: Cachear projeções 30-60-90 personalizadas geradas via LLM

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
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scenario_user
  ON public.scenario_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_generated
  ON public.scenario_projections(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenario_version
  ON public.scenario_projections(user_id, version DESC);

-- ============================================
-- RLS POLICIES
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
-- COMMENTS
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
