-- ============================================
-- Função para criar ou atualizar senha de usuário
-- ============================================
-- Usada pela Edge Function reset-user-password
-- Permite que compradores importados criem senha pelo ThankYou page
-- ============================================

-- Garantir que pgcrypto está habilitada (para crypt e gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Dropar função existente se houver
DROP FUNCTION IF EXISTS create_or_update_user_password(TEXT, TEXT);

-- Criar função que cria ou atualiza usuário no auth.users
CREATE OR REPLACE FUNCTION create_or_update_user_password(
  user_email TEXT,
  user_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  existing_user_id UUID;
  new_user_id UUID;
  hashed_password TEXT;
BEGIN
  -- Log início
  RAISE LOG '[create_or_update_user_password] Processando email: %', user_email;

  -- Hash da senha usando bcrypt com cost factor 10 (padrão Supabase)
  hashed_password := crypt(user_password, gen_salt('bf', 10));

  -- Verificar se usuário já existe
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = lower(user_email);

  IF existing_user_id IS NOT NULL THEN
    -- Usuário existe, atualizar senha
    RAISE LOG '[create_or_update_user_password] Usuário encontrado, atualizando: %', existing_user_id;

    UPDATE auth.users
    SET
      encrypted_password = hashed_password,
      updated_at = NOW(),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()) -- Garantir email confirmado
    WHERE id = existing_user_id;

    RETURN 'updated';
  ELSE
    -- Usuário não existe, criar novo
    RAISE LOG '[create_or_update_user_password] Criando novo usuário para: %', user_email;

    new_user_id := gen_random_uuid();

    -- Inserir na auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      lower(user_email),
      hashed_password,
      NOW(), -- Email já confirmado
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{}'::jsonb,
      FALSE,
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      ''
    );

    -- Inserir identidade (necessário para login funcionar)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', lower(user_email)),
      'email',
      new_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );

    RETURN 'created';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[create_or_update_user_password] ERRO: % %', SQLERRM, SQLSTATE;
  RAISE EXCEPTION 'Erro ao processar usuário: %', SQLERRM;
END;
$$;

-- Dar permissão para service_role executar a função
GRANT EXECUTE ON FUNCTION create_or_update_user_password(TEXT, TEXT) TO service_role;

-- Comentário
COMMENT ON FUNCTION create_or_update_user_password IS 'Cria novo usuário ou atualiza senha de usuário existente no auth.users. Usada pela Edge Function reset-user-password.';
