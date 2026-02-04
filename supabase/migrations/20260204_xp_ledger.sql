-- ============================================
-- MIGRATION: XP Ledger (log de transações de XP)
-- Data: 2026-02-04
-- Objetivo: Criar tabela xp_ledger como fonte de verdade para XP
-- profiles.xp e profiles.completed_steps viram cache via trigger
-- ============================================

-- 1. Criar tabela xp_ledger
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_action UNIQUE (user_id, action)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_id ON public.xp_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_action ON public.xp_ledger(action);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_created ON public.xp_ledger(created_at DESC);

-- 3. RLS
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own ledger" ON public.xp_ledger;
CREATE POLICY "Users can read own ledger"
  ON public.xp_ledger FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ledger" ON public.xp_ledger;
CREATE POLICY "Users can insert own ledger"
  ON public.xp_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all ledger entries" ON public.xp_ledger;
CREATE POLICY "Admins can read all ledger entries"
  ON public.xp_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Trigger: sync profiles.xp e profiles.completed_steps
CREATE OR REPLACE FUNCTION sync_profile_from_ledger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    xp = COALESCE((
      SELECT SUM(xp_amount)
      FROM public.xp_ledger
      WHERE user_id = NEW.user_id
    ), 0),
    completed_steps = COALESCE((
      SELECT array_agg(action ORDER BY created_at)
      FROM public.xp_ledger
      WHERE user_id = NEW.user_id
    ), ARRAY[]::text[]),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_profile_xp ON public.xp_ledger;
CREATE TRIGGER trigger_sync_profile_xp
  AFTER INSERT ON public.xp_ledger
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_from_ledger();

-- 5. Migrar dados existentes (completed_steps → ledger entries)
INSERT INTO public.xp_ledger (user_id, action, xp_amount, description, metadata, created_at)
SELECT
  p.id AS user_id,
  step AS action,
  CASE
    WHEN step = 'protocol-survey' THEN 30
    WHEN step = 'complete-profile' THEN 30
    WHEN step LIKE 'watch-lesson-%' THEN 20
    WHEN step = 'purchase-pdf-diagnosis' THEN 40
    WHEN step = 'purchase-edited-lessons' THEN 40
    WHEN step LIKE 'module-%-checkin' THEN 20
    WHEN step = 'nps-day1' THEN 30
    WHEN step = 'nps-final' THEN 30
    WHEN step IN ('plan-7-days-day-1', 'plan-7-days-day-2', 'plan-7-days-day-3') THEN 10
    WHEN step IN ('plan-7-days-day-4', 'plan-7-days-day-5') THEN 15
    WHEN step IN ('plan-7-days-day-6', 'plan-7-days-day-7') THEN 20
    WHEN step = 'impact-enrollment' THEN 300
    WHEN step LIKE 'badge:%' THEN 0
    ELSE 0
  END AS xp_amount,
  'Migrado de completed_steps' AS description,
  jsonb_build_object('migrated', true, 'migrated_at', NOW()) AS metadata,
  p.updated_at AS created_at
FROM public.profiles p,
     LATERAL unnest(p.completed_steps) AS step
WHERE p.completed_steps IS NOT NULL
  AND array_length(p.completed_steps, 1) > 0
ON CONFLICT (user_id, action) DO NOTHING;

-- 6. Recalcular profiles.xp a partir do ledger (corrigir drift)
UPDATE public.profiles p
SET xp = COALESCE(ledger.total_xp, 0)
FROM (
  SELECT user_id, SUM(xp_amount) AS total_xp
  FROM public.xp_ledger
  GROUP BY user_id
) ledger
WHERE p.id = ledger.user_id;

-- ============================================
-- QUERIES DE VERIFICACAO (rodar manualmente)
-- ============================================
-- Contar entries no ledger:
-- SELECT COUNT(*) FROM public.xp_ledger;
--
-- Comparar profile.xp com ledger:
-- SELECT p.email, p.xp AS profile_xp, COALESCE(l.total, 0) AS ledger_xp
-- FROM profiles p
-- LEFT JOIN (SELECT user_id, SUM(xp_amount) AS total FROM xp_ledger GROUP BY user_id) l ON p.id = l.user_id
-- WHERE p.xp != COALESCE(l.total, 0);
--
-- Ver ledger completo:
-- SELECT p.email, x.action, x.xp_amount, x.created_at
-- FROM xp_ledger x JOIN profiles p ON x.user_id = p.id
-- ORDER BY p.email, x.created_at;
