-- ============================================
-- NOTIFICATIONS ACTIONS - Avisos Clickables
-- ============================================
-- Adiciona campos de navegação para tornar avisos clicáveis

-- Adicionar campos de navegação
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_type TEXT CHECK (action_type IN ('internal', 'external', 'none')),
  ADD COLUMN IF NOT EXISTS target_page TEXT,  -- Ex: 'plano-7-dias', 'impact-offer', 'nps'
  ADD COLUMN IF NOT EXISTS target_section TEXT, -- Ex: 'action-plan', 'radar-chart'
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Defaults
UPDATE public.notifications
SET action_type = 'none'
WHERE action_type IS NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON public.notifications(action_type);

COMMENT ON COLUMN public.notifications.action_type IS 'Tipo de ação: internal (navegação interna), external (link externo), none (apenas leitura)';
COMMENT ON COLUMN public.notifications.target_page IS 'Página de destino (pre-evento, ao-vivo, pos-evento, admin)';
COMMENT ON COLUMN public.notifications.target_section IS 'ID da seção para scroll automático';
COMMENT ON COLUMN public.notifications.external_url IS 'URL externa completa (se action_type=external)';
