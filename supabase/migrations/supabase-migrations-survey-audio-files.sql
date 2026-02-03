-- ============================================
-- MIGRATION: Criar tabela survey_audio_files
-- Para armazenar áudios personalizados gerados após survey
-- ============================================
-- Data: 2026-02-01
-- ============================================

CREATE TABLE IF NOT EXISTS public.survey_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referências
  survey_response_id UUID REFERENCES public.survey_responses(id) UNIQUE,
  user_id UUID REFERENCES public.profiles(id),
  transaction_id TEXT,
  email TEXT NOT NULL,

  -- Áudio
  audio_url TEXT,
  audio_duration_seconds INTEGER,

  -- Script e prompts
  script_generated TEXT,
  openai_prompt TEXT NOT NULL,

  -- OpenAI
  openai_model TEXT DEFAULT 'o1-mini',
  openai_request_id TEXT,

  -- ElevenLabs
  elevenlabs_voice_id TEXT,
  elevenlabs_request_id TEXT,

  -- Go High Level
  ghl_contact_id TEXT,
  ghl_custom_field_audio_url TEXT,
  ghl_custom_field_script TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_survey_audio_email ON public.survey_audio_files(email);
CREATE INDEX IF NOT EXISTS idx_survey_audio_status ON public.survey_audio_files(status);
CREATE INDEX IF NOT EXISTS idx_survey_audio_transaction ON public.survey_audio_files(transaction_id);
CREATE INDEX IF NOT EXISTS idx_survey_audio_created ON public.survey_audio_files(created_at DESC);

-- Comentários
COMMENT ON TABLE public.survey_audio_files IS 'Áudios personalizados gerados após protocolo de iniciação';
COMMENT ON COLUMN public.survey_audio_files.script_generated IS 'Script personalizado gerado pelo OpenAI o1-mini';
COMMENT ON COLUMN public.survey_audio_files.audio_url IS 'URL do áudio no Supabase Storage (bucket: survey-audios)';
COMMENT ON COLUMN public.survey_audio_files.status IS 'Status do processamento: pending, processing, completed, failed';

-- RLS Policies
ALTER TABLE public.survey_audio_files ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (Edge Function usa service_role, mas deixar permissivo)
CREATE POLICY "Allow public insert"
  ON public.survey_audio_files
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir leitura para donos (autenticados)
CREATE POLICY "Allow owner read"
  ON public.survey_audio_files
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    -- Admins podem ver tudo
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email LIKE '%@brainpower%'
    )
  );

-- Apenas admins podem atualizar/deletar
CREATE POLICY "Allow admin update"
  ON public.survey_audio_files
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email LIKE '%@brainpower%'
    )
  );

-- ============================================
-- STORAGE BUCKET: survey-audios
-- ============================================
-- Criar bucket (executar manualmente no Dashboard ou via SQL)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'survey-audios',
  'survey-audios',
  true,  -- Público para GHL poder baixar via URL
  10485760,  -- 10MB
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage bucket
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'survey-audios');

CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'survey-audios');

CREATE POLICY "Owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'survey-audios'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Ver áudios gerados:
-- SELECT * FROM survey_audio_files ORDER BY created_at DESC;

-- Ver áudios no storage:
-- SELECT * FROM storage.objects WHERE bucket_id = 'survey-audios' ORDER BY created_at DESC;

-- ============================================
-- CONCLUÍDO
-- ============================================
