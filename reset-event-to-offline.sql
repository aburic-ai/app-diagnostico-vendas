-- Reset event state to offline
UPDATE public.event_state
SET 
  status = 'offline',
  event_started_at = NULL,
  event_finished_at = NULL,
  current_day = 1,
  current_module = 0,
  offer_visible = false,
  lunch_active = false
WHERE id IS NOT NULL;

-- Verify
SELECT 
  status,
  current_day,
  current_module,
  event_scheduled_start,
  offer_visible
FROM public.event_state;
