-- ============================================
-- FIX: Permitir insert em survey_responses
-- Execute no SQL Editor do Supabase
-- ============================================
-- Problema: Usuários não conseguem salvar respostas da pesquisa
-- Solução: Adicionar policy que permite insert sem autenticação
-- ============================================

-- 1. Verificar RLS atual
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses';

-- 2. Desabilitar RLS temporariamente (ou criar policy correta)
-- Opção A: Desabilitar RLS (para testes)
-- ALTER TABLE public.survey_responses DISABLE ROW LEVEL SECURITY;

-- Opção B: Criar policy que permite insert público (RECOMENDADO)
DROP POLICY IF EXISTS "Allow public insert" ON public.survey_responses;

CREATE POLICY "Allow public insert"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. Permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Users can read own responses" ON public.survey_responses;

CREATE POLICY "Users can read own responses"
  ON public.survey_responses
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    transaction_id IN (SELECT transaction_id FROM purchases WHERE user_id = auth.uid())
  );

-- 4. Verificar novamente
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses';

-- ============================================
-- TESTE
-- ============================================
-- Após executar, tente novamente preencher a pesquisa
-- e verifique se os dados aparecem na tabela
