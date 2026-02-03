-- ============================================
-- SECURITY: RLS Stricto para survey_responses
-- Execute no SQL Editor do Supabase
-- ============================================
-- Data: 2026-02-01
-- Objetivo: Bloquear inserts não autorizados em survey_responses
-- Problema: Policy atual permite `WITH CHECK (true)` → qualquer um pode inserir
-- ============================================

-- 1. Verificar RLS atual
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses';

-- 2. Remover policy permissiva anterior
DROP POLICY IF EXISTS "Allow public insert" ON public.survey_responses;

-- 3. Criar policy estrita: apenas compradores verificados
CREATE POLICY "Allow insert for verified buyers only"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (
    -- Autenticado com compra válida
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.purchases
      WHERE user_id = auth.uid()
        AND status = 'approved'
        AND refunded_at IS NULL
        AND product_slug = 'imersao-diagnostico-vendas'
    ))
    OR
    -- Não-autenticado com transaction/email válidos
    (auth.uid() IS NULL AND (
      -- Validação por transaction_id
      (transaction_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.purchases
        WHERE transaction_id = NEW.transaction_id
          AND status = 'approved'
          AND refunded_at IS NULL
          AND product_slug = 'imersao-diagnostico-vendas'
      ))
      OR
      -- Validação por email
      (email IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.purchases p
        JOIN public.profiles prof ON p.user_id = prof.id
        WHERE prof.email = NEW.email
          AND p.status = 'approved'
          AND p.refunded_at IS NULL
          AND p.product_slug = 'imersao-diagnostico-vendas'
      ))
    ))
  );

-- 4. Verificar novamente
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses';

-- ============================================
-- MUDANÇA CRÍTICA:
-- ============================================
-- ❌ ANTES: WITH CHECK (true) → qualquer um podia inserir
-- ✅ AGORA: Valida status, reembolso e produto antes de permitir
--
-- VALIDAÇÕES FEITAS:
-- 1. status = 'approved' (não aceita pending, refunded, cancelled)
-- 2. refunded_at IS NULL (não aceita compras reembolsadas)
-- 3. product_slug = 'imersao-diagnostico-vendas' (apenas produto correto)
-- ============================================

-- Testar (deve BLOQUEAR insert inválido):
-- INSERT INTO survey_responses (transaction_id, email, survey_data)
-- VALUES ('INVALID_TRANSACTION', 'random@email.com', '{}');
-- Esperado: ERROR - policy violation
