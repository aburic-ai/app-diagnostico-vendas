-- ============================================
-- MIGRATIONS: Melhorias na Tabela PURCHASES
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================
-- Data: 2026-01-31
-- Objetivo: Adicionar constraints, índices e campo refunded_at
-- ============================================

-- 1. Adicionar campo refunded_at para tracking de reembolsos
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ NULL;

-- 2. Adicionar constraint UNIQUE para transaction_id (evitar duplicatas)
ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS unique_transaction_id;

ALTER TABLE public.purchases
  ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id);

-- 3. Adicionar constraint CHECK para status (validar valores permitidos)
ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS check_purchase_status;

ALTER TABLE public.purchases
  ADD CONSTRAINT check_purchase_status
  CHECK (status IN ('approved', 'refunded', 'cancelled', 'pending'));

-- 4. Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_purchases_transaction
  ON public.purchases(transaction_id);

CREATE INDEX IF NOT EXISTS idx_purchases_user
  ON public.purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_purchases_status
  ON public.purchases(status);

CREATE INDEX IF NOT EXISTS idx_purchases_product
  ON public.purchases(product_slug);

CREATE INDEX IF NOT EXISTS idx_purchases_created
  ON public.purchases(purchased_at DESC);

-- 5. Adicionar índice composto para queries comuns (user + status)
CREATE INDEX IF NOT EXISTS idx_purchases_user_status
  ON public.purchases(user_id, status);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar os índices criados:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'purchases';

-- Execute para verificar constraints:
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.purchases'::regclass;

-- ============================================
-- TABELA: NPS RESPONSES (criar se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('day1', 'final')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: um usuário só pode responder cada NPS uma vez
  UNIQUE(user_id, type)
);

-- RLS para nps_responses
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own NPS responses"
  ON public.nps_responses FOR ALL
  USING (auth.uid() = user_id);

-- Índices para nps_responses
CREATE INDEX IF NOT EXISTS idx_nps_user
  ON public.nps_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_nps_type
  ON public.nps_responses(type);

CREATE INDEX IF NOT EXISTS idx_nps_score
  ON public.nps_responses(score);

-- ============================================
-- CONCLUÍDO
-- ============================================
-- ✅ Tabela purchases melhorada com:
--    - Campo refunded_at
--    - Constraint UNIQUE em transaction_id
--    - Constraint CHECK em status
--    - 6 índices para performance
--
-- ✅ Tabela nps_responses criada com:
--    - Validação de score (0-10)
--    - Validação de type (day1, final)
--    - Constraint UNIQUE (user_id, type)
--    - RLS habilitado
--    - 3 índices
