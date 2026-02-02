-- Marcar andre.buric@gmail.com como admin
-- Execute este SQL no Supabase SQL Editor

-- Atualizar perfil para admin
UPDATE public.profiles
SET is_admin = true
WHERE email = 'andre.buric@gmail.com';

-- Verificar se funcionou
SELECT
  id,
  email,
  name,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'andre.buric@gmail.com';

-- Se o usuário não existir ainda, este comando criará quando ele fizer login
-- O campo is_admin já existe na tabela profiles conforme a migration anterior
