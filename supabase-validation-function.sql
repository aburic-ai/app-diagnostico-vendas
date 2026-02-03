-- ============================================
-- SECURITY: Purchase Validation Function
-- Execute no SQL Editor do Supabase
-- ============================================
-- Data: 2026-02-01
-- Objetivo: Validar se usuário é comprador legítimo
-- ============================================

-- Criar função de validação de compra
CREATE OR REPLACE FUNCTION public.is_valid_buyer(
  p_email TEXT,
  p_transaction_id TEXT DEFAULT NULL,
  p_product_slug TEXT DEFAULT 'imersao-diagnostico-vendas'
)
RETURNS TABLE (
  is_valid BOOLEAN,
  purchase_id UUID,
  user_id UUID,
  buyer_name TEXT,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p.id IS NOT NULL
           AND p.status = 'approved'
           AND p.refunded_at IS NULL
           AND p.product_slug = p_product_slug
      THEN TRUE
      ELSE FALSE
    END AS is_valid,
    p.id AS purchase_id,
    p.user_id,
    p.buyer_name,
    CASE
      WHEN p.id IS NULL THEN 'purchase_not_found'
      WHEN p.status != 'approved' THEN 'status_not_approved'
      WHEN p.refunded_at IS NOT NULL THEN 'purchase_refunded'
      WHEN p.product_slug != p_product_slug THEN 'wrong_product'
      ELSE 'valid'
    END AS reason
  FROM public.purchases p
  WHERE
    (p_transaction_id IS NOT NULL AND p.transaction_id = p_transaction_id)
    OR
    (p_transaction_id IS NULL AND p.user_id IN (
      SELECT id FROM public.profiles WHERE email = p_email
    ))
  ORDER BY p.purchased_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissões para usuários autenticados e anônimos
GRANT EXECUTE ON FUNCTION public.is_valid_buyer TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_buyer TO anon;

-- ============================================
-- VALIDAÇÕES QUE A FUNÇÃO FAZ:
-- ============================================
-- 1. ✅ Compra existe (p.id IS NOT NULL)
-- 2. ✅ Status aprovado (p.status = 'approved')
-- 3. ✅ Não reembolsada (p.refunded_at IS NULL)
-- 4. ✅ Produto correto (p.product_slug = 'imersao-diagnostico-vendas')
--
-- RETORNA:
-- - is_valid: true/false
-- - reason: 'valid' | 'purchase_not_found' | 'status_not_approved' | 'purchase_refunded' | 'wrong_product'
-- ============================================

-- Testar a função (exemplo):
-- SELECT * FROM public.is_valid_buyer('teste@email.com', 'HP0603054387');
