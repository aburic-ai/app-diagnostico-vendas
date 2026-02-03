-- ============================================
-- ADD OPENAI THREAD ID TO CHAT CONVERSATIONS
-- ============================================
-- Para suportar OpenAI Assistants API
-- Thread ID é único por conversa e persiste entre mensagens

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS openai_thread_id TEXT;

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_chat_conversations_thread
  ON public.chat_conversations(openai_thread_id);

COMMENT ON COLUMN public.chat_conversations.openai_thread_id IS
  'Thread ID do OpenAI Assistant (se usado em vez de chat completion)';
