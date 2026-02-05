-- ============================================
-- MIGRATION: Permitir upsert em survey_responses e whatsapp_messages
-- Usa email como chave única para evitar duplicatas
-- Se a pessoa reenviar a pesquisa, sobrepõe a resposta anterior
-- ============================================

-- 1. Remover duplicatas existentes por email (manter apenas a mais recente)
DELETE FROM public.survey_responses a
USING public.survey_responses b
WHERE a.email IS NOT NULL
  AND a.email = b.email
  AND a.created_at < b.created_at;

DELETE FROM public.whatsapp_messages a
USING public.whatsapp_messages b
WHERE a.email IS NOT NULL
  AND a.email = b.email
  AND a.created_at < b.created_at;

-- 2. Remover partial indexes antigos (se existirem)
DROP INDEX IF EXISTS idx_survey_responses_transaction_id;
DROP INDEX IF EXISTS idx_whatsapp_messages_transaction_id;

-- 3. Adicionar UNIQUE constraint em email (não-parcial, funciona com ON CONFLICT)
--    PostgreSQL permite múltiplos NULLs em UNIQUE constraints
ALTER TABLE public.survey_responses
  DROP CONSTRAINT IF EXISTS survey_responses_email_unique;
ALTER TABLE public.survey_responses
  ADD CONSTRAINT survey_responses_email_unique UNIQUE (email);

ALTER TABLE public.whatsapp_messages
  DROP CONSTRAINT IF EXISTS whatsapp_messages_email_unique;
ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT whatsapp_messages_email_unique UNIQUE (email);

-- 4. Adicionar policy de UPDATE para survey_responses (necessário para upsert)
DROP POLICY IF EXISTS "Allow public update survey" ON public.survey_responses;

CREATE POLICY "Allow public update survey"
  ON public.survey_responses
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 5. Adicionar policy de UPDATE para whatsapp_messages (necessário para upsert)
DROP POLICY IF EXISTS "Allow public update whatsapp" ON public.whatsapp_messages;

CREATE POLICY "Allow public update whatsapp"
  ON public.whatsapp_messages
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
