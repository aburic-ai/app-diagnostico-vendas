-- ============================================
-- MIGRATION: Criar tabela access_requests
-- Para armazenar solicitações de acesso pendentes
-- ============================================
-- Data: 2026-02-01
-- ============================================

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  transaction_id TEXT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by UUID NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created ON public.access_requests(created_at DESC);

-- Comentários
COMMENT ON TABLE public.access_requests IS 'Solicitações de acesso pendentes para revisão do admin';
COMMENT ON COLUMN public.access_requests.reason IS 'Motivo da falha: purchase_not_found, status_not_approved, purchase_refunded, wrong_product';
COMMENT ON COLUMN public.access_requests.status IS 'Status da solicitação: pending, approved, rejected';

-- RLS Policies
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (para salvar tentativas)
CREATE POLICY "Allow public insert"
  ON public.access_requests
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Apenas admins podem ler
CREATE POLICY "Allow admin read"
  ON public.access_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Verificar se é admin (ajustar conforme sua lógica de admin)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email LIKE '%@brainpower%' -- Ajustar conforme necessário
    )
  );

-- Apenas admins podem atualizar
CREATE POLICY "Allow admin update"
  ON public.access_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email LIKE '%@brainpower%'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email LIKE '%@brainpower%'
    )
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Ver solicitações pendentes:
-- SELECT * FROM access_requests WHERE status = 'pending' ORDER BY created_at DESC;

-- Aprovar solicitação:
-- UPDATE access_requests SET status = 'approved', reviewed_at = NOW() WHERE id = 'uuid';

-- ============================================
-- CONCLUÍDO
-- ============================================
