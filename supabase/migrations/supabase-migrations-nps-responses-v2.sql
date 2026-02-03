-- Migration: Tabela de Respostas NPS (v2 - Idempotente)
-- Data: 2026-02-02
-- Descrição: Armazenar avaliações NPS dos participantes

-- Criar tabela nps_responses (se não existir)
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('day1', 'final')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_nps_type'
  ) THEN
    ALTER TABLE public.nps_responses
      ADD CONSTRAINT unique_user_nps_type UNIQUE (user_id, type);
  END IF;
END $$;

-- RLS Policies
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- Drop policies existentes para recriar (evita erros)
DROP POLICY IF EXISTS "Users view own NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Users insert own NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Admins view all NPS responses" ON public.nps_responses;

-- Usuários podem ver apenas suas próprias respostas
CREATE POLICY "Users view own NPS responses"
  ON public.nps_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias respostas
CREATE POLICY "Users insert own NPS responses"
  ON public.nps_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins podem ver todas as respostas (para análise)
CREATE POLICY "Admins view all NPS responses"
  ON public.nps_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Índices para performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_nps_user_id ON public.nps_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_type ON public.nps_responses(type);
CREATE INDEX IF NOT EXISTS idx_nps_score ON public.nps_responses(score);
CREATE INDEX IF NOT EXISTS idx_nps_created_at ON public.nps_responses(created_at DESC);

-- Comentários
COMMENT ON TABLE public.nps_responses IS 'Respostas NPS dos participantes (Dia 1 e Final)';
COMMENT ON COLUMN public.nps_responses.type IS 'Tipo de NPS: day1 (após Dia 1) ou final (após evento completo)';
COMMENT ON COLUMN public.nps_responses.score IS 'Score NPS de 0 a 10 (0-6=Detrator, 7-8=Neutro, 9-10=Promotor)';
COMMENT ON COLUMN public.nps_responses.feedback IS 'Comentário opcional do usuário';

-- View para análise (apenas admins) - recriar se já existir
DROP VIEW IF EXISTS public.nps_analysis;

CREATE VIEW public.nps_analysis AS
SELECT
  type,
  COUNT(*) as total_responses,
  ROUND(AVG(score), 2) as avg_score,
  COUNT(*) FILTER (WHERE score >= 9) as promoters,
  COUNT(*) FILTER (WHERE score >= 7 AND score <= 8) as passives,
  COUNT(*) FILTER (WHERE score <= 6) as detractors,
  ROUND(
    (COUNT(*) FILTER (WHERE score >= 9)::DECIMAL - COUNT(*) FILTER (WHERE score <= 6)::DECIMAL)
    / NULLIF(COUNT(*)::DECIMAL, 0) * 100,
    2
  ) as nps_score
FROM public.nps_responses
GROUP BY type;

COMMENT ON VIEW public.nps_analysis IS 'Análise agregada de NPS (Promotores, Neutros, Detratores e Score NPS)';

-- Verificação final
SELECT 'NPS Migration completed successfully!' as status;
SELECT * FROM nps_analysis;
