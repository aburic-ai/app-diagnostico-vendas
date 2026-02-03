-- Migration: Adicionar coluna offer_links no event_state
-- Data: 2026-02-02
-- Objetivo: Persistir configurações de links da oferta IMPACT

-- Adicionar coluna offer_links como JSONB
ALTER TABLE public.event_state
ADD COLUMN IF NOT EXISTS offer_links JSONB DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.event_state.offer_links IS 'Links da oferta IMPACT (URLs e parâmetros UTM)';

-- Exemplo de estrutura do JSON:
-- {
--   "posEventoLink": "https://imersao.neuropersuasao.com.br/",
--   "ingresso1Percent": "https://pay.hotmart.com/K91662125A?off=66czkxps",
--   "ingressoExecutivo": "https://pay.hotmart.com/K91662125A?off=y1frgqvy",
--   "utmSource": "appdiagn",
--   "utmMedium": "app",
--   "utmCampaign": "imersao2026",
--   "utmContent": "oferta"
-- }

-- Verificação
SELECT id, offer_links FROM public.event_state;
