-- ============================================
-- TAB ACCESS CONTROL - Controle de Liberação de Abas
-- ============================================
-- Data: 2026-02-03
-- Descrição: Adiciona controle granular de acesso às abas (Preparação, Ao Vivo, Pós Evento)
--
-- LÓGICA DE ACESSO:
-- 1. Toggle manual ativo? → Usa ele (prioridade máxima)
-- 2. Passou da data de bloqueio? → BLOQUEIA
-- 3. Passou da data de liberação? → LIBERA
-- 4. Senão → BLOQUEADO (padrão)

-- ============================================
-- PREPARAÇÃO (Pré-Evento)
-- ============================================

ALTER TABLE public.event_state
  ADD COLUMN IF NOT EXISTS pre_evento_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pre_evento_unlock_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pre_evento_lock_date TIMESTAMPTZ;

-- Defaults iniciais
UPDATE public.event_state
SET
  pre_evento_enabled = TRUE,
  pre_evento_unlock_date = '2026-02-01 00:00:00-03'::TIMESTAMPTZ,  -- Liberado desde 01/02
  pre_evento_lock_date = '2026-02-28 09:30:00-03'::TIMESTAMPTZ     -- Bloqueia quando Ao Vivo começar
WHERE pre_evento_unlock_date IS NULL;

-- ============================================
-- AO VIVO
-- ============================================

ALTER TABLE public.event_state
  ADD COLUMN IF NOT EXISTS ao_vivo_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ao_vivo_unlock_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ao_vivo_lock_date TIMESTAMPTZ;

-- Defaults iniciais
UPDATE public.event_state
SET
  ao_vivo_enabled = FALSE,
  ao_vivo_unlock_date = '2026-02-28 09:30:00-03'::TIMESTAMPTZ,     -- Libera no Dia 1
  ao_vivo_lock_date = '2026-03-01 18:00:00-03'::TIMESTAMPTZ        -- Bloqueia quando Pós Evento começar
WHERE ao_vivo_unlock_date IS NULL;

-- ============================================
-- PÓS EVENTO
-- ============================================

ALTER TABLE public.event_state
  ADD COLUMN IF NOT EXISTS pos_evento_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pos_evento_unlock_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pos_evento_lock_date TIMESTAMPTZ;

-- Defaults iniciais
UPDATE public.event_state
SET
  pos_evento_enabled = FALSE,
  pos_evento_unlock_date = '2026-03-01 18:00:00-03'::TIMESTAMPTZ,  -- Libera após Dia 2
  pos_evento_lock_date = NULL                                       -- Nunca bloqueia (NULL = sem bloqueio)
WHERE pos_evento_unlock_date IS NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.event_state.pre_evento_enabled IS
  'Toggle manual: TRUE = liberado, FALSE = bloqueado (sobrescreve datas)';
COMMENT ON COLUMN public.event_state.pre_evento_unlock_date IS
  'Data/hora de liberação automática (se NULL, nunca libera automaticamente)';
COMMENT ON COLUMN public.event_state.pre_evento_lock_date IS
  'Data/hora de bloqueio automático (se NULL, nunca bloqueia automaticamente)';

COMMENT ON COLUMN public.event_state.ao_vivo_enabled IS
  'Toggle manual: TRUE = liberado, FALSE = bloqueado (sobrescreve datas)';
COMMENT ON COLUMN public.event_state.ao_vivo_unlock_date IS
  'Data/hora de liberação automática';
COMMENT ON COLUMN public.event_state.ao_vivo_lock_date IS
  'Data/hora de bloqueio automático';

COMMENT ON COLUMN public.event_state.pos_evento_enabled IS
  'Toggle manual: TRUE = liberado, FALSE = bloqueado (sobrescreve datas)';
COMMENT ON COLUMN public.event_state.pos_evento_unlock_date IS
  'Data/hora de liberação automática';
COMMENT ON COLUMN public.event_state.pos_evento_lock_date IS
  'Data/hora de bloqueio automático';

-- ============================================
-- EXEMPLO DE USO
-- ============================================
--
-- Liberar Pós Evento manualmente:
-- UPDATE event_state SET pos_evento_enabled = TRUE;
--
-- Bloquear Preparação quando Ao Vivo começar:
-- UPDATE event_state SET pre_evento_lock_date = '2026-02-28 09:30:00-03';
--
-- Configurar Ao Vivo para liberar automaticamente:
-- UPDATE event_state
-- SET ao_vivo_unlock_date = '2026-02-28 09:30:00-03',
--     ao_vivo_enabled = FALSE;  -- Deixa FALSE, vai liberar automaticamente

-- Verificação
SELECT
  'Tab Access Control Migration completed!' as status,
  pre_evento_enabled, pre_evento_unlock_date, pre_evento_lock_date,
  ao_vivo_enabled, ao_vivo_unlock_date, ao_vivo_lock_date,
  pos_evento_enabled, pos_evento_unlock_date, pos_evento_lock_date
FROM event_state;
