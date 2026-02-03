# 30. SUPABASE SCHEMA REFERENCE

**Última Atualização:** 2026-02-03
**Database:** Supabase PostgreSQL
**Project ID:** `yvjzkhxczbxidtdmkafx`

---

## 📋 ÍNDICE

1. [Visão Geral](#visao-geral)
2. [Core Tables](#core-tables)
3. [RLS Policies](#rls-policies)
4. [SQL Functions](#sql-functions)
5. [Storage Buckets](#storage-buckets)
6. [Realtime Subscriptions](#realtime-subscriptions)
7. [Common Queries](#common-queries)
8. [Migration History](#migration-history)
9. [Related Documentation](#related-documentation)

---

## 1. VISÃO GERAL

Este documento descreve o **estado atual** do schema do banco de dados Supabase do projeto App Diagnóstico de Vendas.

### Propósito do Banco

- **Autenticação:** Perfis de usuários e controle de acesso
- **Gamification:** Sistema de XP, níveis e progresso
- **Compras:** Integração com Hotmart (webhook)
- **Evento:** Estado global do evento ao vivo (dia, módulo, status)
- **Feedback:** Pesquisas de calibragem, NPS, notificações
- **Audio:** Áudios personalizados gerados via IA

### Tabelas Principais

| Tabela | Propósito | Realtime |
|--------|-----------|----------|
| `profiles` | Dados do usuário, XP, progresso | ✅ Sim |
| `purchases` | Compras Hotmart, validação de acesso | ❌ Não |
| `survey_responses` | Respostas do Protocolo de Iniciação (8 questões) | ❌ Não |
| `event_state` | Estado global do evento (singleton) | ✅ Sim |
| `notifications` | Avisos enviados pelo Admin | ✅ Sim |
| `nps_responses` | Feedback NPS (Dia 1 + Final) | ❌ Não |
| `survey_audio_files` | Áudios personalizados (IA) | ❌ Não |
| `whatsapp_messages` | Histórico de mensagens WhatsApp | ❌ Não |

---

## 2. CORE TABLES

### 2.1. profiles

**Descrição:** Perfil do usuário, XP, passos completados.

**Schema:**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  photo_url TEXT,
  xp INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);
```

**Colunas:**

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | - | PK, referencia auth.users |
| `email` | TEXT | ❌ | - | Email único |
| `name` | TEXT | ✅ | NULL | Nome completo |
| `phone` | TEXT | ✅ | NULL | Telefone (formato: +55 11 99999-9999) |
| `company` | TEXT | ✅ | NULL | Empresa |
| `role` | TEXT | ✅ | NULL | Cargo |
| `photo_url` | TEXT | ✅ | NULL | URL da foto de perfil |
| `xp` | INTEGER | ❌ | 0 | Pontos de experiência |
| `completed_steps` | TEXT[] | ❌ | {} | Array de steps completados |
| `is_admin` | BOOLEAN | ❌ | false | Flag de admin |
| `created_at` | TIMESTAMPTZ | ❌ | NOW() | Data de criação |
| `updated_at` | TIMESTAMPTZ | ❌ | NOW() | Data de atualização |

**XP System:**
- Meta total: 1000 XP
- Níveis: Novato (0-99), Iniciante (100-199), Iniciante+ (200-399), Intermediário (400-599), Avançado (600-999), Mestre IMPACT (1000)

**completed_steps Examples:**
```sql
['purchase-imersao', 'survey-complete', 'profile-complete', 'watched-bonus-videos']
```

---

### 2.2. purchases

**Descrição:** Registro de compras via Hotmart, usado para validação de acesso.

**Schema:**
```sql
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  product_slug TEXT NOT NULL,
  price NUMERIC NOT NULL,
  full_price NUMERIC,
  buyer_name TEXT,
  buyer_document TEXT,
  buyer_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('approved', 'refunded', 'cancelled')),
  refunded_at TIMESTAMPTZ,
  manual_approval BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_purchases_transaction ON public.purchases(transaction_id);
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_product ON public.purchases(product_slug);
CREATE INDEX idx_purchases_email ON public.purchases((
  SELECT email FROM profiles WHERE id = user_id
));
```

**Colunas:**

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | gen_random_uuid() | PK |
| `user_id` | UUID | ✅ | NULL | FK profiles(id) |
| `transaction_id` | TEXT | ❌ | - | ID da transação Hotmart (HP...) |
| `product_slug` | TEXT | ❌ | - | Slug do produto |
| `price` | NUMERIC | ❌ | - | Preço pago |
| `full_price` | NUMERIC | ✅ | NULL | Preço cheio (antes desconto) |
| `buyer_name` | TEXT | ✅ | NULL | Primeiro nome em Title Case |
| `buyer_document` | TEXT | ✅ | NULL | CPF do comprador |
| `buyer_phone` | TEXT | ✅ | NULL | Telefone (formato: 55 11999999999) |
| `status` | TEXT | ❌ | - | approved, refunded, cancelled |
| `refunded_at` | TIMESTAMPTZ | ✅ | NULL | Data do reembolso |
| `manual_approval` | BOOLEAN | ❌ | false | Override manual (bypass validation) |
| `purchased_at` | TIMESTAMPTZ | ❌ | - | Data da compra |
| `created_at` | TIMESTAMPTZ | ❌ | NOW() | Data de inserção no banco |

**Product Slugs:**
- `imersao-diagnostico-vendas` - Produto principal (+100 XP)
- `diagnostico-pdf` - Order bump 1 (+40 XP)
- `aulas-editadas` - Order bump 2 (+40 XP)
- `mentoria-impact` - Upsell pós-evento (+300 XP)

**manual_approval:**
- Quando `true`, bypassa validações de status e product_slug
- Usado pelo Admin para liberar acesso manualmente
- Ver: [32-SECURITY-VALIDATION.md](./32-SECURITY-VALIDATION.md)

---

### 2.3. survey_responses

**Descrição:** Respostas do Protocolo de Iniciação (8 questões IMPACT).

**Schema:**
```sql
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_id TEXT,
  email TEXT,
  survey_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX idx_survey_responses_transaction ON public.survey_responses(transaction_id);
CREATE INDEX idx_survey_responses_email ON public.survey_responses(email);
```

**Colunas:**

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | gen_random_uuid() | PK |
| `user_id` | UUID | ✅ | NULL | FK profiles(id) (preenchido após login) |
| `transaction_id` | TEXT | ✅ | NULL | Transaction Hotmart (para vinculação) |
| `email` | TEXT | ✅ | NULL | Email do comprador |
| `survey_data` | JSONB | ❌ | - | Respostas das 8 questões |
| `created_at` | TIMESTAMPTZ | ❌ | NOW() | Data de preenchimento |

**survey_data Example:**
```json
{
  "inspiracao": 7,
  "motivacao": 9,
  "preparacao": 8,
  "apresentacao": 9,
  "conversao": 10,
  "transformacao": 9
}
```

**Validação:**
- RLS policy garante que apenas compradores verificados podem inserir
- Ver função `is_valid_buyer()` abaixo

---

### 2.4. event_state

**Descrição:** Estado global do evento (singleton - apenas 1 registro).

**Schema:**
```sql
CREATE TABLE public.event_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Estado principal
  status TEXT NOT NULL DEFAULT 'offline'
    CHECK (status IN ('offline', 'live', 'paused', 'finished', 'lunch', 'activity')),
  current_day INTEGER DEFAULT 1 CHECK (current_day IN (1, 2)),
  current_module INTEGER DEFAULT 0 CHECK (current_module >= 0 AND current_module <= 17),

  -- Controles de features
  offer_unlocked BOOLEAN DEFAULT false,
  offer_visible BOOLEAN DEFAULT false,
  ai_enabled BOOLEAN DEFAULT true,
  offer_links JSONB DEFAULT '{}'::jsonb,

  -- Controle de intervalo (almoço)
  lunch_active BOOLEAN DEFAULT false,
  lunch_started_at TIMESTAMPTZ,
  lunch_duration_minutes INTEGER DEFAULT 60,

  -- Controle de acesso às abas (Preparação, Ao Vivo, Pós Evento)
  pre_evento_enabled BOOLEAN DEFAULT true,
  pre_evento_unlock_date TIMESTAMPTZ,
  pre_evento_lock_date TIMESTAMPTZ,

  ao_vivo_enabled BOOLEAN DEFAULT false,
  ao_vivo_unlock_date TIMESTAMPTZ,
  ao_vivo_lock_date TIMESTAMPTZ,

  pos_evento_enabled BOOLEAN DEFAULT false,
  pos_evento_unlock_date TIMESTAMPTZ,
  pos_evento_lock_date TIMESTAMPTZ,

  -- Timestamps
  event_started_at TIMESTAMPTZ,
  event_finished_at TIMESTAMPTZ,
  event_scheduled_start TIMESTAMPTZ DEFAULT '2026-02-28 09:30:00-03',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Garantir singleton (apenas 1 registro)
CREATE UNIQUE INDEX idx_event_state_singleton ON public.event_state ((1));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_event_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_event_state_updated_at
  BEFORE UPDATE ON public.event_state
  FOR EACH ROW
  EXECUTE FUNCTION update_event_state_timestamp();
```

**Colunas Principais:**

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `status` | TEXT | 'offline' | Estado do evento |
| `current_day` | INTEGER | 1 | Dia atual (1 ou 2) |
| `current_module` | INTEGER | 0 | Módulo atual (0-17) |
| `offer_unlocked` | BOOLEAN | false | Se oferta IMPACT foi desbloqueada |
| `offer_visible` | BOOLEAN | false | Se oferta está visível |
| `ai_enabled` | BOOLEAN | true | Se Assistente IA está ativo |
| `offer_links` | JSONB | {} | Links das ofertas IMPACT |

**Status Possíveis:**
- `offline` - Antes do evento, mostra countdown
- `live` - Ao vivo, transmissão ativa
- `paused` - Pausado temporariamente
- `finished` - Evento encerrado
- `lunch` - Intervalo para almoço
- `activity` - Atividade prática

**Tab Access Control:**
- 9 colunas para controlar acesso às 3 abas
- Cada aba tem: `enabled`, `unlock_date`, `lock_date`
- Ver: [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md)

---

### 2.5. notifications

**Descrição:** Avisos enviados pelo Admin aos participantes.

**Schema:**
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'danger')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_read_by ON public.notifications USING GIN(read_by);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

**Colunas:**

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | gen_random_uuid() | PK |
| `type` | TEXT | ❌ | - | info, warning, success, danger |
| `title` | TEXT | ❌ | - | Título do aviso |
| `message` | TEXT | ❌ | - | Mensagem completa |
| `read_by` | UUID[] | ❌ | {} | Array de user_ids que leram |
| `created_at` | TIMESTAMPTZ | ❌ | NOW() | Data de criação |

**read_by:**
- Array de UUIDs dos usuários que já leram
- Índice GIN para queries eficientes: `WHERE NOT (read_by @> ARRAY[user_id])`

---

### 2.6. survey_audio_files

**Descrição:** Áudios personalizados gerados via IA (OpenAI + ElevenLabs).

**Schema:**
```sql
CREATE TABLE public.survey_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_response_id UUID REFERENCES public.survey_responses(id) UNIQUE,
  user_id UUID REFERENCES public.profiles(id),
  email TEXT NOT NULL,

  -- Script e áudio
  script_generated TEXT NOT NULL,
  audio_url TEXT,
  audio_duration_seconds INTEGER,

  -- Metadados
  elevenlabs_voice_id TEXT,
  elevenlabs_request_id TEXT,
  openai_model TEXT DEFAULT 'o1-mini',

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_survey_audio_email ON public.survey_audio_files(email);
CREATE INDEX idx_survey_audio_status ON public.survey_audio_files(status);
```

**Colunas:**

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | ❌ | gen_random_uuid() | PK |
| `survey_response_id` | UUID | ✅ | NULL | FK survey_responses(id), UNIQUE |
| `user_id` | UUID | ✅ | NULL | FK profiles(id) |
| `email` | TEXT | ❌ | - | Email do comprador |
| `script_generated` | TEXT | ❌ | - | Script personalizado (OpenAI) |
| `audio_url` | TEXT | ✅ | NULL | URL do MP3 no Storage |
| `audio_duration_seconds` | INTEGER | ✅ | NULL | Duração em segundos |
| `status` | TEXT | ❌ | 'pending' | pending, processing, completed, failed |
| `openai_model` | TEXT | ❌ | 'o1-mini' | Modelo OpenAI usado |
| `elevenlabs_voice_id` | TEXT | ✅ | NULL | Voice ID ElevenLabs |

**Fluxo:**
1. User preenche survey → `survey_response` criado
2. GHL Workflow 2 chama Edge Function `generate-audio`
3. Edge Function gera script (OpenAI) + áudio (ElevenLabs)
4. Upload para Storage bucket `survey-audios`
5. Registro criado com status `completed`

Ver: [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md)

---

### 2.7. nps_responses

**Descrição:** Respostas de NPS (Dia 1 + Final).

**Schema:**
```sql
CREATE TABLE public.nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('day1', 'final')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_nps_responses_user_id ON public.nps_responses(user_id);
CREATE INDEX idx_nps_responses_type ON public.nps_responses(type);
```

---

### 2.8. whatsapp_messages

**Descrição:** Histórico de mensagens WhatsApp geradas via IA (legacy).

**Schema:**
```sql
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT,
  email TEXT,
  survey_data JSONB,
  prompt TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_whatsapp_transaction ON public.whatsapp_messages(transaction_id);
CREATE INDEX idx_whatsapp_email ON public.whatsapp_messages(email);
```

**Nota:** Tabela legacy, pode ser removida no futuro.

---

## 3. RLS POLICIES

### 3.1. profiles

**Policy:** "Users can read own profile"
```sql
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

**Policy:** "Users can update own profile"
```sql
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

### 3.2. purchases

**Policy:** "Users can read own purchases"
```sql
CREATE POLICY "Users can read own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 3.3. survey_responses

**Policy:** "Allow insert for verified buyers only"
```sql
CREATE POLICY "Allow insert for verified buyers only"
  ON public.survey_responses FOR INSERT
  WITH CHECK (
    (SELECT is_valid FROM public.is_valid_buyer(
      email,
      transaction_id,
      'imersao-diagnostico-vendas'
    ))
  );
```

**Validação:**
- Usa função `is_valid_buyer()` (ver seção 4.1)
- Bloqueia inserções de não-compradores
- Admin pode fazer override via `manual_approval`

---

### 3.4. event_state

**Policy:** "Anyone can read event state"
```sql
CREATE POLICY "Anyone can read event state"
  ON public.event_state FOR SELECT
  USING (true);
```

**Policy:** "Only admins can update event state"
```sql
CREATE POLICY "Only admins can update event state"
  ON public.event_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
```

---

### 3.5. notifications

**Policy:** "Anyone can read notifications"
```sql
CREATE POLICY "Anyone can read notifications"
  ON public.notifications FOR SELECT
  USING (true);
```

**Policy:** "Users can mark notifications as read"
```sql
CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

**Nota:** UPDATE aberto para permitir `read_by` array updates.

---

## 4. SQL FUNCTIONS

### 4.1. is_valid_buyer()

**Descrição:** Valida se email/transaction pertence a comprador válido.

**Signature:**
```sql
CREATE OR REPLACE FUNCTION public.is_valid_buyer(
  p_email TEXT,
  p_transaction_id TEXT,
  p_product_slug TEXT
)
RETURNS TABLE(
  is_valid BOOLEAN,
  purchase_id UUID,
  user_id UUID,
  buyer_name TEXT,
  reason TEXT
)
```

**Lógica:**
1. Busca purchase por email OU transaction_id
2. Verifica `manual_approval = true` (bypass)
3. OU verifica `status = 'approved'` AND `refunded_at IS NULL` AND `product_slug` correto
4. Retorna resultado com reason

**Example:**
```sql
SELECT * FROM public.is_valid_buyer(
  'usuario@email.com',
  'HP123456',
  'imersao-diagnostico-vendas'
);

-- Retorno:
is_valid | purchase_id | user_id | buyer_name | reason
---------|-------------|---------|------------|-------
true     | uuid...     | uuid... | "João"     | valid
```

**Reasons:**
- `valid` - Compra aprovada
- `manual_approval` - Liberado manualmente pelo Admin
- `purchase_not_found` - Compra não existe
- `refunded` - Compra reembolsada
- `wrong_product` - Produto diferente do esperado

**Documentação completa:** [32-SECURITY-VALIDATION.md](./32-SECURITY-VALIDATION.md)

---

## 5. STORAGE BUCKETS

### 5.1. survey-audios

**Descrição:** Armazena arquivos MP3 dos áudios personalizados.

**Configuração:**
- **Access:** Private (apenas autenticados podem fazer upload)
- **Max file size:** 10MB
- **MIME types:** `audio/mpeg`, `audio/mp3`
- **Path pattern:** `{email}/{timestamp}.mp3`

**RLS Policies:**
- Admins podem upload
- Usuários podem download próprios áudios

**Example URL:**
```
https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/teste@exemplo.com/1706745600000.mp3
```

---

## 6. REALTIME SUBSCRIPTIONS

### Tabelas com Realtime Habilitado

**1. profiles**
```typescript
supabase
  .channel('profiles')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'profiles',
    filter: `id=eq.${userId}`
  }, (payload) => {
    console.log('Profile updated:', payload)
  })
  .subscribe()
```

**2. event_state**
```typescript
supabase
  .channel('event_state')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'event_state'
  }, (payload) => {
    console.log('Event state changed:', payload)
  })
  .subscribe()
```

**3. notifications**
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    console.log('New notification:', payload.new)
  })
  .subscribe()
```

---

## 7. COMMON QUERIES

### Verificar Compras do Usuário

```sql
SELECT
  transaction_id,
  product_slug,
  price,
  buyer_name,
  status,
  manual_approval,
  purchased_at
FROM purchases
WHERE user_id = 'user-uuid-aqui'
ORDER BY purchased_at DESC;
```

---

### Calcular XP Total do Usuário

```sql
SELECT
  name,
  email,
  xp,
  CASE
    WHEN xp >= 1000 THEN 'Mestre IMPACT'
    WHEN xp >= 600 THEN 'Avançado'
    WHEN xp >= 400 THEN 'Intermediário'
    WHEN xp >= 200 THEN 'Iniciante+'
    WHEN xp >= 100 THEN 'Iniciante'
    ELSE 'Novato'
  END AS nivel,
  completed_steps
FROM profiles
WHERE id = 'user-uuid-aqui';
```

---

### Verificar Estado Atual do Evento

```sql
SELECT
  status,
  current_day,
  current_module,
  offer_unlocked,
  ai_enabled,
  event_scheduled_start,
  updated_at
FROM event_state
LIMIT 1;
```

---

### Buscar Notificações Não Lidas

```sql
SELECT
  id,
  type,
  title,
  message,
  created_at
FROM notifications
WHERE NOT (read_by @> ARRAY['user-uuid-aqui'])
ORDER BY created_at DESC;
```

---

### Áudios Gerados nas Últimas 24h

```sql
SELECT
  email,
  status,
  audio_url,
  LEFT(script_generated, 100) AS script_preview,
  audio_duration_seconds,
  created_at
FROM survey_audio_files
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 8. MIGRATION HISTORY

**⚠️ IMPORTANTE:** Esta seção é apenas referência histórica. As migrations já foram executadas. NÃO execute novamente.

### Executed Migrations (Ordem Cronológica)

1. **supabase-validation-function.sql** - Função `is_valid_buyer()`
2. **fix-survey-responses-rls-v2.sql** - RLS policy de validação
3. **supabase-migrations-purchases-v2.sql** - Campos buyer_name, buyer_document, etc.
4. **supabase-migrations-purchases-v3.sql** - Campo `manual_approval`
5. **supabase-migrations-event-state-v2.sql** - Tabela event_state singleton
6. **supabase-migrations-event-state-v2-fix.sql** - Colunas faltantes (offer_unlocked, ai_enabled, etc.)
7. **supabase-migrations-event-state-v3-add-activity.sql** - Status 'activity'
8. **supabase-migrations-event-state-v4-add-start-time.sql** - event_scheduled_start
9. **supabase/migrations/20260203000004_tab_access_control.sql** - 9 colunas de tab access
10. **supabase-migrations-offer-links.sql** - Campo offer_links (JSONB)
11. **supabase-migrations-survey-audio-files.sql** - Tabela + storage bucket
12. **supabase-migrations-notifications-v3-read-by.sql** - Campo read_by (UUID[])

**Para executar novas migrations:**
- Ver: [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md#3-database-migrations)

---

## 9. RELATED DOCUMENTATION

### Architecture (30-39)
- [32-SECURITY-VALIDATION.md](./32-SECURITY-VALIDATION.md) - Sistema de validação de compras

### Core Features (10-19)
- [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md) - Cálculo de score
- [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md) - Controle de acesso às abas
- [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md) - Sistema de áudio personalizado

### Developer Guides (50-59)
- [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md) - Guia completo de deployment
- [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md) - Solução de problemas

---

## 📊 RESUMO DO SCHEMA

**Tabelas:** 8 (profiles, purchases, survey_responses, event_state, notifications, survey_audio_files, nps_responses, whatsapp_messages)

**Funções SQL:** 1 (is_valid_buyer)

**Storage Buckets:** 1 (survey-audios)

**Realtime Tables:** 3 (profiles, event_state, notifications)

**RLS Policies:** 9 políticas ativas

**Migrations Executadas:** 12 migrations

---

**Desenvolvido por:** Claude Code + Andre Buric
**Data:** 2026-02-01 a 2026-02-03
**Status:** ✅ Schema estável e em produção

---

**NOTA:** Este documento descreve o estado atual do schema. Para informações sobre como executar novas migrations ou modificar o schema, consulte [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md).
