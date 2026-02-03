-- Migration: FIX diagnostic_entries - Adicionar colunas faltantes
-- Data: 2026-02-02
-- Objetivo: Adicionar colunas que estão faltando na tabela

-- Primeiro, vamos ver a estrutura atual
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'diagnostic_entries'
ORDER BY ordinal_position;

-- Agora adicionar colunas que faltam (se não existirem)

-- Adicionar coluna 'day' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'day'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN day INTEGER NOT NULL DEFAULT 1;
    -- Adicionar constraint depois que a coluna existir
    ALTER TABLE public.diagnostic_entries ADD CONSTRAINT check_day CHECK (day IN (1, 2));
  END IF;
END $$;

-- Adicionar intention_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'intention_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN intention_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar message_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'message_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN message_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar pain_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'pain_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN pain_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar authority_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'authority_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN authority_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar commitment_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'commitment_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN commitment_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar transformation_score se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'transformation_score'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN transformation_score NUMERIC(3,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Adicionar created_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Adicionar updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'diagnostic_entries' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.diagnostic_entries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Adicionar constraint UNIQUE (user_id, day) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_day'
  ) THEN
    ALTER TABLE public.diagnostic_entries
    ADD CONSTRAINT unique_user_day UNIQUE (user_id, day);
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

-- Ver estrutura final
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'diagnostic_entries'
ORDER BY ordinal_position;
