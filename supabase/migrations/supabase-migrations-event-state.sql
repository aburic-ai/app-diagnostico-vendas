-- Migration: Event State - Estado Global do Evento
-- Data: 2026-02-02
-- Descrição: Centralizar estado do evento para sincronização Admin ↔ Páginas

-- Criar tabela event_state (singleton - apenas 1 registro)
CREATE TABLE IF NOT EXISTS public.event_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Estado principal do evento
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'paused', 'finished')),
  current_day INTEGER DEFAULT 1 CHECK (current_day IN (1, 2)),
  current_module INTEGER DEFAULT 0 CHECK (current_module >= 0 AND current_module <= 17),

  -- Controles de features
  offer_unlocked BOOLEAN DEFAULT false,
  offer_visible BOOLEAN DEFAULT false,
  ai_enabled BOOLEAN DEFAULT true,

  -- Controle de intervalo (almoço)
  lunch_active BOOLEAN DEFAULT false,
  lunch_started_at TIMESTAMPTZ,
  lunch_duration_minutes INTEGER DEFAULT 60,

  -- Timestamps
  event_started_at TIMESTAMPTZ,
  event_finished_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Garantir apenas 1 registro (singleton pattern)
CREATE UNIQUE INDEX idx_event_state_singleton ON public.event_state ((1));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_event_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_state_updated_at
  BEFORE UPDATE ON public.event_state
  FOR EACH ROW
  EXECUTE FUNCTION update_event_state_timestamp();

-- RLS Policies
ALTER TABLE public.event_state ENABLE ROW LEVEL SECURITY;

-- Todos podem ler (para sincronizar estado)
CREATE POLICY "Anyone can read event state"
  ON public.event_state FOR SELECT
  USING (true);

-- Apenas admins podem atualizar
CREATE POLICY "Only admins can update event state"
  ON public.event_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Apenas admins podem inserir (primeira vez)
CREATE POLICY "Only admins can insert event state"
  ON public.event_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Habilitar Realtime para sincronização instantânea
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_state;

-- Inserir estado inicial (offline)
INSERT INTO public.event_state (status, current_day, current_module, ai_enabled)
VALUES ('offline', 1, 0, true)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE public.event_state IS 'Estado global do evento (singleton - apenas 1 registro)';
COMMENT ON COLUMN public.event_state.status IS 'Status do evento: offline (antes), live (ao vivo), paused (pausado), finished (encerrado)';
COMMENT ON COLUMN public.event_state.current_day IS 'Dia atual do evento (1 ou 2)';
COMMENT ON COLUMN public.event_state.current_module IS 'Módulo atual sendo apresentado (0-17)';
COMMENT ON COLUMN public.event_state.offer_unlocked IS 'Se oferta IMPACT foi desbloqueada pelo Admin';
COMMENT ON COLUMN public.event_state.offer_visible IS 'Se oferta IMPACT está visível para usuários (pode ser fechada após desbloquear)';
COMMENT ON COLUMN public.event_state.lunch_active IS 'Se intervalo de almoço está ativo';
