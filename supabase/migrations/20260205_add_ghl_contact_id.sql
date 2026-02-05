-- Adicionar coluna ghl_contact_id na tabela profiles
-- Para vincular contatos do GoHighLevel com usuários do Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Criar índice para buscas
CREATE INDEX IF NOT EXISTS idx_profiles_ghl_contact_id ON profiles(ghl_contact_id);

COMMENT ON COLUMN profiles.ghl_contact_id IS 'ID do contato no GoHighLevel';
