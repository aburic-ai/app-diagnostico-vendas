-- ============================================
-- SCHEMA DO BANCO DE DADOS - App Diagnóstico de Vendas
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- TABELA: PERFIL DO USUARIO
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  photo_url TEXT,
  business_type TEXT,
  is_admin BOOLEAN DEFAULT false,
  xp INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: criar perfil automaticamente ao criar auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABELA: RESPOSTAS DA PESQUISA
-- ============================================
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  transaction_id TEXT,
  email TEXT,
  survey_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: MENSAGENS WHATSAPP (geradas por IA)
-- ============================================
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  transaction_id TEXT,
  email TEXT,
  survey_data JSONB NOT NULL,
  prompt TEXT NOT NULL,
  generated_message TEXT,
  used_fallback BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- ============================================
-- TABELA: DIAGNOSTICOS IMPACT
-- ============================================
CREATE TABLE public.diagnostic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  event_day INTEGER NOT NULL CHECK (event_day IN (1, 2)),
  block_number INTEGER NOT NULL,
  inspiracao INTEGER CHECK (inspiracao BETWEEN 0 AND 10),
  motivacao INTEGER CHECK (motivacao BETWEEN 0 AND 10),
  preparacao INTEGER CHECK (preparacao BETWEEN 0 AND 10),
  apresentacao INTEGER CHECK (apresentacao BETWEEN 0 AND 10),
  conversao INTEGER CHECK (conversao BETWEEN 0 AND 10),
  transformacao INTEGER CHECK (transformacao BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: ESTADO DO EVENTO (singleton - 1 row)
-- ============================================
CREATE TABLE public.event_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status TEXT DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'paused', 'activity', 'lunch')),
  current_day INTEGER DEFAULT 1 CHECK (current_day IN (1, 2)),
  current_module INTEGER DEFAULT 0,
  offer_released BOOLEAN DEFAULT false,
  ai_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir row inicial
INSERT INTO public.event_state (id) VALUES (1);

-- ============================================
-- TABELA: NOTIFICACOES
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'alert', 'offer', 'nps')),
  action_label TEXT,
  action_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABELA: COMPRAS
-- ============================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  product_slug TEXT NOT NULL,
  transaction_id TEXT,
  price DECIMAL(10,2),
  status TEXT DEFAULT 'approved',
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles: usuario le o proprio, admin le todos
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Event state: todos leem, admin atualiza
ALTER TABLE public.event_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads event state"
  ON public.event_state FOR SELECT
  USING (true);

CREATE POLICY "Admins update event state"
  ON public.event_state FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Notifications: todos leem, admin insere
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone reads notifications"
  ON public.notifications FOR SELECT
  USING (true);

CREATE POLICY "Admins create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Diagnostics: usuario le/escreve os proprios
ALTER TABLE public.diagnostic_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diagnostics"
  ON public.diagnostic_entries FOR ALL
  USING (auth.uid() = user_id);

-- Survey: usuario insere os proprios
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own survey"
  ON public.survey_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Purchases: usuario le as proprias
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- CONCLUÍDO
-- ============================================
-- Agora vá em Database > Replication e habilite real-time para:
-- - event_state
-- - notifications
