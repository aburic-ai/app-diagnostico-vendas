-- ============================================
-- FIX: Trigger handle_new_user deve fazer UPSERT
-- ============================================
-- Problema: Compradores importados têm profile mas não têm auth.users
-- Quando tentam criar conta, o trigger falha com "duplicate key value"
--
-- Solução: Usar ON CONFLICT para atualizar o profile existente
-- vinculando ao novo auth.users.id
-- ============================================

-- 1. Substituir a função do trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta inserir novo profile
  -- Se email já existe, atualiza o id para vincular ao auth.users
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: O trigger já existe (on_auth_user_created), não precisa recriar
-- A função foi substituída com CREATE OR REPLACE
