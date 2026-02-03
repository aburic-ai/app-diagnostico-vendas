-- Migration: Event State v3 - Add 'activity' status
-- Data: 2026-02-02
-- Descrição: Adicionar 'activity' como status válido para o evento

-- Drop existing constraint
ALTER TABLE public.event_state DROP CONSTRAINT IF EXISTS event_state_status_check;

-- Add new constraint with 'activity' included
ALTER TABLE public.event_state
  ADD CONSTRAINT event_state_status_check
  CHECK (status IN ('offline', 'live', 'paused', 'activity', 'finished'));

-- Update comment
COMMENT ON COLUMN public.event_state.status IS 'Status do evento: offline (antes), live (ao vivo), paused (pausado), activity (atividade em andamento), finished (encerrado)';

-- Verification
SELECT 'Event State v3 Migration completed successfully!' as status;
SELECT status FROM event_state;
