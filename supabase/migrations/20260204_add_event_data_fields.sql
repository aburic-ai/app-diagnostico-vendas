-- Add event data fields to event_state table
-- These store the edition name and day1/day2 schedule info

ALTER TABLE event_state
  ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT 'Fevereiro 2026',
  ADD COLUMN IF NOT EXISTS day1_date TEXT DEFAULT '2026-02-28',
  ADD COLUMN IF NOT EXISTS day1_time TEXT DEFAULT '09:30',
  ADD COLUMN IF NOT EXISTS day2_date TEXT DEFAULT '2026-03-01',
  ADD COLUMN IF NOT EXISTS day2_time TEXT DEFAULT '09:30';
