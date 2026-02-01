-- ============================================
-- MIGRATION: Adicionar campos de comprador na tabela purchases
-- Execute no SQL Editor do Supabase
-- ============================================
-- Data: 2026-01-31
-- Objetivo: Adicionar informações detalhadas do comprador
-- ============================================

-- 1. Adicionar campo buyer_name (nome completo do comprador, ex: "ANDRE AFFONSO BURIC")
--    Nota: A interface formata para exibir apenas primeiro nome em Title Case
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS buyer_name TEXT NULL;

-- 2. Adicionar campo buyer_document (CPF/CNPJ)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS buyer_document TEXT NULL;

-- 3. Adicionar campo buyer_phone (telefone completo)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT NULL;

-- 4. Adicionar campo full_price (preço cheio antes de desconto)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS full_price NUMERIC(10, 2) NULL;

-- 5. Criar índice no documento (útil para buscas)
CREATE INDEX IF NOT EXISTS idx_purchases_document
  ON public.purchases(buyer_document);

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar as colunas adicionadas:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'purchases'
-- ORDER BY ordinal_position;

-- ============================================
-- CONCLUÍDO
-- ============================================
-- ✅ Campos adicionados:
--    - buyer_name (TEXT)
--    - buyer_document (TEXT)
--    - buyer_phone (TEXT)
--    - full_price (NUMERIC)
--    - Índice em buyer_document
