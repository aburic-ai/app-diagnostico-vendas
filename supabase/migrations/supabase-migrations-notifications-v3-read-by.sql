-- Migration: Notifications v3 - Add read_by field
-- Data: 2026-02-02
-- Descrição: Adicionar campo read_by para tracking de leitura por usuário

-- Adicionar campo read_by (array de UUIDs dos usuários que leram)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Comentário
COMMENT ON COLUMN public.notifications.read_by IS 'Array de UUIDs dos usuários que já leram esta notificação';

-- Índice para performance (queries que filtram por usuário)
CREATE INDEX IF NOT EXISTS idx_notifications_read_by ON public.notifications USING GIN(read_by);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Update policy para permitir que usuários marquem como lidas
CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verificação
SELECT 'Notifications v3 Migration completed successfully!' as status;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
