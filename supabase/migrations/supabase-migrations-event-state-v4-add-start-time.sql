-- Migration: Event State v4 - Add event start time for countdown
-- Data: 2026-02-02
-- Descrição: Adicionar data/hora prevista de início do evento

-- Add event_scheduled_start column
ALTER TABLE public.event_state
  ADD COLUMN IF NOT EXISTS event_scheduled_start TIMESTAMPTZ;

-- Set default to event date (28/02/2026 09:30 BRT)
UPDATE public.event_state
SET event_scheduled_start = '2026-02-28 09:30:00-03'::TIMESTAMPTZ
WHERE event_scheduled_start IS NULL;

-- Add comment
COMMENT ON COLUMN public.event_state.event_scheduled_start IS 'Data/hora prevista de início do evento (para countdown)';

-- Verification
SELECT 'Event State v4 Migration completed successfully!' as status;
SELECT status, event_scheduled_start FROM event_state;
