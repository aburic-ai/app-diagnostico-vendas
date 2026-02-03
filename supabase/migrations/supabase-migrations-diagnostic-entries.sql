-- Migration: Criar/atualizar tabela diagnostic_entries
-- Data: 2026-02-02
-- Objetivo: Salvar diagnósticos IMPACT dos participantes (Dia 1 e Dia 2)

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.diagnostic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day IN (1, 2)),

  -- Scores IMPACT (0-10)
  intention_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  message_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  pain_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  authority_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  commitment_score NUMERIC(3,1) NOT NULL DEFAULT 0,
  transformation_score NUMERIC(3,1) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: Um usuário só pode ter um diagnóstico por dia
  CONSTRAINT unique_user_day UNIQUE (user_id, day)
);

-- Se a tabela já existe mas está faltando colunas, adicionar
DO $$
BEGIN
  -- Adicionar authority_score se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries'
    AND column_name = 'authority_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries
    ADD COLUMN authority_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;

  -- Adicionar commitment_score se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries'
    AND column_name = 'commitment_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries
    ADD COLUMN commitment_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;

  -- Adicionar transformation_score se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries'
    AND column_name = 'transformation_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries
    ADD COLUMN transformation_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- RLS Policies
ALTER TABLE public.diagnostic_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own diagnostics" ON public.diagnostic_entries;
DROP POLICY IF EXISTS "Users can insert own diagnostics" ON public.diagnostic_entries;
DROP POLICY IF EXISTS "Users can update own diagnostics" ON public.diagnostic_entries;
DROP POLICY IF EXISTS "Users can delete own diagnostics" ON public.diagnostic_entries;

-- Users can view their own diagnostics
CREATE POLICY "Users can view own diagnostics"
  ON public.diagnostic_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own diagnostics
CREATE POLICY "Users can insert own diagnostics"
  ON public.diagnostic_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own diagnostics
CREATE POLICY "Users can update own diagnostics"
  ON public.diagnostic_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own diagnostics
CREATE POLICY "Users can delete own diagnostics"
  ON public.diagnostic_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_diagnostic_user_id ON public.diagnostic_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_day ON public.diagnostic_entries(day);
CREATE INDEX IF NOT EXISTS idx_diagnostic_user_day ON public.diagnostic_entries(user_id, day);

-- Comentários
COMMENT ON TABLE public.diagnostic_entries IS 'Diagnósticos IMPACT dos participantes (Dia 1 e Dia 2)';
COMMENT ON COLUMN public.diagnostic_entries.intention_score IS 'Score de Intenção (I do IMPACT)';
COMMENT ON COLUMN public.diagnostic_entries.message_score IS 'Score de Mensagem (M do IMPACT)';
COMMENT ON COLUMN public.diagnostic_entries.pain_score IS 'Score de Dor (P do IMPACT)';
COMMENT ON COLUMN public.diagnostic_entries.authority_score IS 'Score de Autoridade (A do IMPACT)';
COMMENT ON COLUMN public.diagnostic_entries.commitment_score IS 'Score de Compromisso (C do IMPACT)';
COMMENT ON COLUMN public.diagnostic_entries.transformation_score IS 'Score de Transformação (T do IMPACT)';

-- Verificar estrutura final
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'diagnostic_entries'
ORDER BY ordinal_position;
