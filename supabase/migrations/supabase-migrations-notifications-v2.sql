-- Migration: Avisos Clickables - Adicionar campos de navegação
-- Data: 2026-02-02
-- Descrição: Transforma avisos em links clicáveis que navegam para seções específicas do app

-- Adicionar campos de navegação
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_type TEXT CHECK (action_type IN ('internal', 'external', 'none')),
  ADD COLUMN IF NOT EXISTS target_page TEXT,  -- Ex: 'plano-7-dias', 'impact-offer', 'nps'
  ADD COLUMN IF NOT EXISTS target_section TEXT, -- Ex: 'action-plan', 'radar-chart'
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Comentários nas colunas
COMMENT ON COLUMN public.notifications.action_type IS 'Tipo de ação: internal (navega dentro do app), external (abre URL externa), none (apenas leitura)';
COMMENT ON COLUMN public.notifications.target_page IS 'Identificador da página alvo (ex: plano-7-dias, impact-offer, nps, diagnostico)';
COMMENT ON COLUMN public.notifications.target_section IS 'ID da seção para scroll automático (ex: action-plan, radar-chart)';
COMMENT ON COLUMN public.notifications.external_url IS 'URL completa para links externos';

-- Defaults para registros existentes
UPDATE public.notifications
SET action_type = 'none'
WHERE action_type IS NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON public.notifications(action_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_page ON public.notifications(target_page) WHERE target_page IS NOT NULL;

-- Exemplos de uso (comentados):
/*
-- Aviso para plano de 7 dias
INSERT INTO public.notifications (type, title, message, action_type, target_page, target_section)
VALUES (
  'info',
  'Plano de 7 dias ativo',
  'Complete as tarefas diárias para consolidar seu diagnóstico. Clique para acessar.',
  'internal',
  'plano-7-dias',
  'action-plan'
);

-- Aviso para oferta IMPACT
INSERT INTO public.notifications (type, title, message, action_type, target_page, target_section)
VALUES (
  'offer',
  'Imersão IMPACT Liberada!',
  'Seu diagnóstico foi concluído. Garanta sua vaga na imersão presencial.',
  'internal',
  'impact-offer',
  'locked-offer'
);

-- Aviso externo
INSERT INTO public.notifications (type, title, message, action_type, external_url)
VALUES (
  'alert',
  'Nova funcionalidade',
  'Confira o novo simulador de vendas IA. Acesse o guia.',
  'external',
  'https://docs.exemplo.com/simulador-ia'
);
*/
