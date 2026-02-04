-- ============================================
-- MIGRATION: Adicionar buyer_email na tabela purchases
-- Para que o ThankYou page consiga ler o email do comprador
-- sem depender de join com profiles (bloqueado por RLS)
-- ============================================
-- Data: 2026-02-04
-- ============================================

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS buyer_email TEXT;

-- Preencher buyer_email retroativamente a partir dos profiles existentes
UPDATE public.purchases p
SET buyer_email = pr.email
FROM public.profiles pr
WHERE p.user_id = pr.id
  AND p.buyer_email IS NULL
  AND pr.email IS NOT NULL;

-- Indice para busca por email
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_email ON public.purchases(buyer_email);
