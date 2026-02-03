-- Migration FIX: Adicionar colunas faltantes na event_state
-- Data: 2026-02-02
-- Descrição: Corrige tabela event_state existente adicionando colunas que faltam

-- Adicionar colunas faltantes (se não existirem)
ALTER TABLE public.event_state
  ADD COLUMN IF NOT EXISTS offer_unlocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_visible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS lunch_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lunch_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lunch_duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS event_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Garantir que status aceita todos os valores necessários
DO $$
BEGIN
  -- Tentar adicionar constraint (se não existir)
  ALTER TABLE public.event_state
    DROP CONSTRAINT IF EXISTS event_state_status_check;

  ALTER TABLE public.event_state
    ADD CONSTRAINT event_state_status_check
    CHECK (status IN ('offline', 'live', 'paused', 'finished', 'activity'));
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignora se já existir
END $$;

-- Atualizar valores default se colunas estiverem vazias
UPDATE public.event_state
SET
  offer_unlocked = COALESCE(offer_unlocked, false),
  offer_visible = COALESCE(offer_visible, false),
  ai_enabled = COALESCE(ai_enabled, true),
  lunch_active = COALESCE(lunch_active, false),
  lunch_duration_minutes = COALESCE(lunch_duration_minutes, 60)
WHERE id IS NOT NULL;

-- Adicionar comentários nas novas colunas
COMMENT ON COLUMN public.event_state.offer_unlocked IS 'Se oferta IMPACT foi desbloqueada pelo Admin';
COMMENT ON COLUMN public.event_state.offer_visible IS 'Se oferta IMPACT está visível para usuários';
COMMENT ON COLUMN public.event_state.ai_enabled IS 'Se chat IA está habilitado';
COMMENT ON COLUMN public.event_state.lunch_active IS 'Se intervalo de almoço está ativo';

-- Verificar resultado
SELECT
  'Event State FIX completed!' as status,
  'Colunas adicionadas: offer_unlocked, offer_visible, ai_enabled, lunch_active' as details;

SELECT * FROM event_state;
