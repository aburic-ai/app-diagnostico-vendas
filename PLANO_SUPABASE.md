# Plano de Integracao Supabase - App Diagnostico de Vendas

> Documento para execucao em qualquer maquina com acesso ao repositorio.
> Gerado em: 2026-01-30

---

## Visao Geral

Integrar Supabase como backend do app para:
- Autenticacao real (email + senha)
- Persistencia de dados (diagnosticos, pesquisa, XP)
- Real-time (estado do evento, notificacoes)
- Webhook Hotmart (criacao automatica de usuarios)
- Edge Functions (IA, geracao de mensagens)

## Pre-requisitos

1. Criar conta em [supabase.com](https://supabase.com)
2. Criar projeto "diagnostico-vendas" (regiao: **sa-east-1** / South America)
3. Obter **Project URL** e **anon key** em Settings > API
4. `npm install @supabase/supabase-js`

---

## Fase 1: Setup Inicial

### Arquivos a criar

```
src/
├── lib/
│   └── supabase.ts          # Cliente Supabase
├── context/
│   └── AuthContext.tsx       # Provider de autenticacao
├── hooks/
│   ├── useAuth.ts           # Hook de auth
│   ├── useEventState.ts     # Hook real-time evento
│   └── useUserProgress.ts   # Hook de progresso/XP
└── .env.local                # Variaveis de ambiente
```

### `.env.local`

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

---

## Fase 2: Schema do Banco de Dados

Executar no **SQL Editor** do Supabase (Dashboard > SQL Editor > New Query):

```sql
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
-- REAL-TIME: Habilitar para tabelas necessarias
-- ============================================
-- No dashboard Supabase: Database > Replication
-- Habilitar real-time para:
-- - event_state
-- - notifications
```

### Resumo das Tabelas

| Tabela | Descricao | Rows estimados |
|--------|-----------|----------------|
| profiles | Perfil do usuario (auto-criado via trigger) | ~1000 |
| survey_responses | Respostas da pesquisa de calibragem | ~1000 |
| whatsapp_messages | Mensagens WhatsApp geradas por IA | ~1000 |
| diagnostic_entries | Diagnosticos IMPACT (dia 1 e 2) | ~2000 |
| event_state | Estado do evento (singleton) | 1 |
| notifications | Avisos enviados pelo admin | ~50 |
| purchases | Compras (Hotmart webhook) | ~1000 |

---

## Fase 3: Autenticacao

### `src/context/AuthContext.tsx`

```typescript
// Provider que wrapa o App
// Gerencia sessao do Supabase
// Expoe: user, profile, signIn, signUp, signOut, loading
// Carrega profile do banco ao fazer login
// Redireciona para /login se nao autenticado
```

### Fluxo de Login

```
/login
  -> email + senha
  -> supabase.auth.signInWithPassword()
  -> carrega profile do banco
  -> redirect para /pre-evento
```

### Fluxo ThankYou (novo usuario)

```
/obrigado?transaction=xxx
  -> pesquisa (salva em survey_responses)
  -> cria senha: supabase.auth.signUp({ email, password })
  -> trigger cria profile automaticamente
  -> auto-login
  -> redirect para /pre-evento
```

### Rotas Protegidas

| Rota | Acesso |
|------|--------|
| `/pre-evento` | Requer auth |
| `/ao-vivo` | Requer auth |
| `/pos-evento` | Requer auth |
| `/admin` | Requer auth + is_admin |
| `/obrigado` | Publica (sem auth) |
| `/login` | Publica |

---

## Fase 4: Real-Time do Evento

### `src/hooks/useEventState.ts`

```typescript
// Subscreve na tabela event_state via Supabase Realtime
// Retorna: { status, currentDay, currentModule, offerReleased, aiEnabled }
// Atualiza automaticamente quando admin muda algo
// Usado em: AoVivo.tsx (LiveTicker), BottomNav (locks)
```

### No Admin

- Botoes "AO VIVO", "PAUSAR", etc -> UPDATE na event_state
- Avancar modulo -> UPDATE current_module
- Trocar dia -> UPDATE current_day
- Liberar oferta -> UPDATE offer_released
- Todos os participantes recebem em tempo real

---

## Fase 5: Persistencia de Dados

### Diagnosticos
- AoVivo.tsx salva entradas na tabela diagnostic_entries
- Carrega diagnosticos anteriores ao abrir a pagina
- Radar chart usa dados reais do banco

### XP e Progresso
- Acoes completadas -> UPDATE xp no profiles
- completed_steps[] -> array de steps concluidos
- Barra de progresso no PreEvento le do banco

### Notificacoes
- Admin INSERT na tabela notifications
- Participantes recebem via Realtime subscription
- Drawer de notificacoes mostra do banco

---

## Fase 6: Webhook Hotmart

### Edge Function: `supabase/functions/hotmart-webhook/index.ts`

```
Hotmart compra confirmada
  -> POST /functions/v1/hotmart-webhook
  -> Verifica assinatura do webhook
  -> Cria usuario no auth (sem senha: invite)
  -> Insere purchase na tabela
  -> Responde 200 OK
```

O usuario depois cria senha na ThankYou page (`/obrigado`).

---

## Fase 7: PWA

### Arquivos

- `public/manifest.json` - Metadados do app
- `public/sw.js` - Service worker (cache de assets)
- Instruir participantes a "Adicionar a Tela Inicial"

---

## Ordem de Implementacao (Passo a Passo)

| # | Acao | Arquivo(s) |
|---|------|------------|
| 1 | `npm install @supabase/supabase-js` | package.json |
| 2 | Criar `.env.local` com URL e key | .env.local |
| 3 | Criar cliente Supabase | src/lib/supabase.ts |
| 4 | Executar SQL schema no dashboard | (Supabase SQL Editor) |
| 5 | Criar AuthContext + useAuth | src/context/AuthContext.tsx, src/hooks/useAuth.ts |
| 6 | Modificar Login -> auth real | src/pages/Login.tsx |
| 7 | Modificar ThankYou -> signUp + salvar pesquisa | src/pages/ThankYou.tsx |
| 8 | Modificar App -> rotas protegidas | src/App.tsx |
| 9 | Criar useEventState -> real-time | src/hooks/useEventState.ts |
| 10 | Modificar Admin -> controles reais | src/pages/Admin.tsx |
| 11 | Modificar AoVivo -> diagnosticos salvos | src/pages/AoVivo.tsx |
| 12 | Modificar PreEvento -> XP do banco | src/pages/PreEvento.tsx |
| 13 | PWA (manifest + service worker) | public/manifest.json, public/sw.js |

---

## Verificacao Final

1. Login com email/senha funciona
2. ThankYou cria usuario e salva pesquisa
3. Diagnosticos persistem entre sessoes
4. Admin muda status -> todos os apps atualizam
5. XP salva e carrega corretamente
6. Rotas protegidas redirecionam para /login
7. `npx tsc --noEmit` sem erros

---

## Custos Estimados

| Item | Custo |
|------|-------|
| Supabase | $0 (free tier suficiente para ~1000 usuarios) |
| Vercel Hosting | $0 (free tier) |
| OpenAI API (evento) | $5-150 (depende do modelo) |
| Apple Developer (se nativo) | $99/ano |
| **Total minimo** | **~$5-50** |

---

## Contexto do Projeto

- **Repositorio:** GitHub (aburic-ai)
- **Stack:** React + Vite + TypeScript + Framer Motion
- **Deploy:** Vercel (auto-deploy via GitHub)
- **Evento:** 07/03/2026 e 08/03/2026
- **Participantes:** ~1000
- **Documentacao completa:** `PLANO_COMPLETO_INFRAESTRUTURA.md`
- **Design system:** `DESIGN_SYSTEM.md`
