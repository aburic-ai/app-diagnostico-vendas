-- ============================================
-- DEBUG: Verificar mensagens do chat
-- ============================================

-- 1. Ver todas as conversas do seu usuário
SELECT
  id,
  user_id,
  event_day,
  module_id,
  started_at,
  ended_at,
  total_messages,
  openai_thread_id,
  created_at
FROM chat_conversations
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver todas as mensagens da última conversa
SELECT
  cm.id,
  cm.conversation_id,
  cm.role,
  cm.content,
  cm.created_at
FROM chat_messages cm
JOIN chat_conversations cc ON cc.id = cm.conversation_id
ORDER BY cm.created_at DESC
LIMIT 20;

-- 3. Contar mensagens por conversa
SELECT
  conversation_id,
  COUNT(*) as total_messages,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message
FROM chat_messages
GROUP BY conversation_id
ORDER BY last_message DESC;
