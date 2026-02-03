-- ============================================
-- MIGRATION: Adicionar campo manual_approval na tabela purchases
-- Execute no SQL Editor do Supabase
-- ============================================
-- Data: 2026-02-01
-- Objetivo: Permitir admin liberar acesso mesmo sem validação automática
-- ============================================

-- Adicionar campo manual_approval (aprovação manual do admin)
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS manual_approval BOOLEAN DEFAULT false;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.purchases.manual_approval IS
  'Permite admin liberar acesso mesmo sem validação automática passar. Usado para casos especiais de suporte.';

-- Criar índice para queries
CREATE INDEX IF NOT EXISTS idx_purchases_manual_approval
  ON public.purchases(manual_approval)
  WHERE manual_approval = true;

-- ============================================
-- USO DO CAMPO:
-- ============================================
-- Quando admin quer liberar acesso manualmente:
--   UPDATE purchases
--   SET manual_approval = true
--   WHERE email = 'usuario@email.com';
--
-- A validação agora aceita:
--   (status = 'approved') OR (manual_approval = true)
-- ============================================

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'purchases'
ORDER BY ordinal_position;

-- ============================================
-- CONCLUÍDO
-- ============================================
-- ✅ Campo adicionado: manual_approval (BOOLEAN DEFAULT false)
-- ✅ Índice criado para melhor performance
-- ✅ Comentário documentado
