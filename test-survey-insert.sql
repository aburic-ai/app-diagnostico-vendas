-- ============================================
-- TESTE: Inserir dados manualmente em survey_responses
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a tabela existe e está vazia
SELECT COUNT(*) as total_registros FROM survey_responses;

-- 2. Inserir um registro de teste
INSERT INTO survey_responses (transaction_id, email, survey_data)
VALUES (
  'HP0603054387',
  'teste@email.com',
  '{"q1": "8", "q2": "7", "q3": "9", "q4": "6", "q5": "8", "q6": "7", "q7": "9", "q8": "8"}'::jsonb
);

-- 3. Verificar se foi inserido
SELECT * FROM survey_responses;

-- 4. Limpar teste (opcional)
-- DELETE FROM survey_responses WHERE email = 'teste@email.com';
