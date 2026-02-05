-- Migration: Atualizar datas do evento de Fevereiro para Março 2026
-- Evento mudou de 28/02-01/03 para 07/03-08/03

UPDATE public.event_state SET
  -- Datas das abas
  pre_evento_lock_date = '2026-03-07 09:40:00-03'::TIMESTAMPTZ,
  ao_vivo_unlock_date = '2026-03-07 09:30:00-03'::TIMESTAMPTZ,
  ao_vivo_lock_date = '2026-03-08 19:00:00-03'::TIMESTAMPTZ,
  pos_evento_unlock_date = '2026-03-09 07:00:00-03'::TIMESTAMPTZ,
  pos_evento_lock_date = '2026-03-30 00:00:00-03'::TIMESTAMPTZ,
  -- Dados do evento
  edition = 'Março 2026',
  day1_date = '2026-03-07',
  day2_date = '2026-03-08',
  -- Scheduled start
  event_scheduled_start = '2026-03-07 09:30:00-03'::TIMESTAMPTZ;
