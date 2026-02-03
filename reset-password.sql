-- Script para verificar e resetar senha do usuário
-- Execute no Supabase SQL Editor

-- 1. VERIFICAR se o usuário existe na tabela auth.users
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'andre.buric@gmail.com';

-- 2. VERIFICAR se existe perfil associado
SELECT
  id,
  email,
  name,
  is_admin,
  created_at
FROM public.profiles
WHERE email = 'andre.buric@gmail.com';

-- 3. Se o usuário existe mas a senha não funciona, você tem 2 opções:

-- OPÇÃO A: Resetar a senha via SQL (NÃO RECOMENDADO - use a UI do Supabase)
-- Vá em: Authentication > Users > Encontre seu email > ... > Reset Password
-- Isso enviará um email de reset

-- OPÇÃO B: Criar um novo usuário (se o anterior não existir)
-- Vá em: Authentication > Users > Add User
-- Email: andre.buric@gmail.com
-- Password: A12345678 (ou a senha que você quiser)
-- Auto Confirm User: ✅ SIM (marque essa opção!)

-- 4. Depois de criar/resetar, marque como admin:
UPDATE public.profiles
SET is_admin = true
WHERE email = 'andre.buric@gmail.com';

-- 5. VERIFICAR novamente
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  p.is_admin,
  p.name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'andre.buric@gmail.com';
