# 53. GUIA DE DEPLOYMENT

**Última Atualização:** 2026-02-03
**Status:** ✅ Completo e Testado

---

## 📋 ÍNDICE

1. [Visão Geral](#visao-geral)
2. [Supabase CLI Setup](#supabase-cli-setup)
3. [Database Migrations](#database-migrations)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [Security Deployment](#security-deployment)
6. [Hotmart Integration](#hotmart-integration)
7. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
8. [Testing & Validation](#testing-validation)
9. [Monitoring](#monitoring)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)
12. [Support & Manual Overrides](#support-manual-overrides)

---

## 1. VISÃO GERAL

### Deployment Types

Este projeto possui 3 tipos principais de deployment:

**1. Database (Supabase)**
- SQL migrations (schema, RLS, functions)
- Executadas via Supabase SQL Editor ou CLI

**2. Backend (Supabase Edge Functions)**
- `hotmart-webhook` - Processa compras da Hotmart
- `generate-audio` - Gera áudios personalizados via IA
- Deployadas via Supabase CLI

**3. Frontend (Vercel)**
- React app em Next.js
- Deploy automático via git push
- Environment variables no painel Vercel

---

### Prerequisites

**Contas necessárias:**
- [x] Supabase account (projeto criado)
- [x] Vercel account (projeto linkado ao git)
- [x] Hotmart account (produto criado)
- [x] OpenAI API key (para áudio personalizado)
- [x] ElevenLabs API key (para TTS)

**Ferramentas necessárias:**
- [x] Git instalado
- [x] Node.js 18+ instalado
- [x] Supabase CLI instalado (ver seção 2)

---

## 2. SUPABASE CLI SETUP

### 2.1. Instalar Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

**Verificar instalação:**
```bash
supabase --version
# Ou se instalado via ~/.local/bin:
~/.local/bin/supabase --version
```

---

### 2.2. Login no Supabase

```bash
supabase login
```

Isso abrirá o navegador para autenticação.

**OU configure token manualmente:**
```bash
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"
```

---

### 2.3. Linkar Projeto Local

**1. Obter Project Reference ID:**
- Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
- Abra seu projeto
- Vá em **Settings** → **General**
- Copie o **Reference ID** (exemplo: `yvjzkhxczbxidtdmkafx`)

**2. Linkar projeto:**
```bash
cd "/Users/andre/Brainpower Dropbox/Brain Power/CLAUDE CODE/app-diagnostico-vendas"

supabase link --project-ref yvjzkhxczbxidtdmkafx
```

**Resultado esperado:**
```
Finished supabase link.
```

---

## 3. DATABASE MIGRATIONS

### 3.1. Ordem de Execução

Execute as migrations **NESTA ORDEM** via Supabase SQL Editor:

#### Migration 1: Validation Function
```
Arquivo: supabase-validation-function.sql
Descrição: Função para validar comprador antes de permitir inserção de survey
```

**Executar:**
1. Acesse: [Supabase SQL Editor](https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/sql/new)
2. Copie conteúdo completo do arquivo
3. Cole no editor
4. Clique em **Run** (ou Ctrl/Cmd + Enter)

**Resultado esperado:**
```
Success. No rows returned
```

---

#### Migration 2: RLS Policy
```
Arquivo: fix-survey-responses-rls-v2.sql
Descrição: RLS policy para permitir apenas compradores verificados
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Policy "Allow insert for verified buyers only" created
```

---

#### Migration 3: Manual Approval
```
Arquivo: supabase-migrations-purchases-v3.sql
Descrição: Adiciona campo manual_approval para liberação manual de acesso
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Column "manual_approval" added to table "purchases"
```

---

#### Migration 4: Event State
```
Arquivo: supabase-migrations-event-state-v2.sql
Descrição: Tabela singleton para estado global do evento
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Event State Migration completed successfully!
```

---

#### Migration 5: Tab Access Control
```
Arquivo: supabase/migrations/20260203000004_tab_access_control.sql
Descrição: Adiciona 9 colunas para controle de acesso às 3 abas
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Tab Access Control Migration completed!
```

---

#### Migration 6: Offer Links
```
Arquivo: supabase-migrations-offer-links.sql
Descrição: Adiciona campo JSONB para links das ofertas
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Column "offer_links" added
```

---

#### Migration 7: Survey Audio Files
```
Arquivo: supabase-migrations-survey-audio-files.sql
Descrição: Tabela + storage bucket para áudios personalizados
```

**Executar:**
1. Copie conteúdo completo
2. Cole no SQL Editor
3. Run

**Resultado esperado:**
```
Table survey_audio_files created
Bucket survey-audios created
```

---

### 3.2. Verificação das Migrations

**Verificar validation function:**
```sql
SELECT * FROM public.is_valid_buyer(
  'teste@exemplo.com',
  'HP0603054387',
  'imersao-diagnostico-vendas'
);
```

**Verificar RLS policy:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses'
  AND policyname = 'Allow insert for verified buyers only';
```

**Verificar manual_approval:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'purchases'
  AND column_name = 'manual_approval';
```

**Verificar event_state:**
```sql
SELECT * FROM event_state LIMIT 1;
```

**Verificar tab access control:**
```sql
SELECT
  pre_evento_enabled,
  ao_vivo_enabled,
  pos_evento_enabled
FROM event_state LIMIT 1;
```

**Verificar survey_audio_files:**
```sql
SELECT COUNT(*) FROM survey_audio_files;
```

---

## 4. EDGE FUNCTIONS DEPLOYMENT

### 4.1. Hotmart Webhook

#### 4.1.1. O que faz
- Recebe webhooks da Hotmart (compras, reembolsos, cancelamentos)
- Cria/atualiza registro na tabela `purchases`
- Cria perfil do usuário se não existir
- Atribui XP conforme produto comprado
- Formata nome do comprador (apenas primeiro nome em Title Case)

---

#### 4.1.2. Configurar Secrets

**1. Obter Hottok da Hotmart:**
- Acesse: https://app.hotmart.com
- Vá em **Ferramentas** → **Webhooks**
- Copie o **Hottok** (Token de Segurança)

**OU use um secret temporário para testes:**
```bash
HOTTOK="test-secret-hotmart-2026"
```

**2. Configurar no Supabase:**
```bash
supabase secrets set HOTMART_WEBHOOK_SECRET="test-secret-hotmart-2026"
```

**Verificar:**
```bash
supabase secrets list
```

---

#### 4.1.3. Deploy

```bash
cd "/Users/andre/Brainpower Dropbox/Brain Power/CLAUDE CODE/app-diagnostico-vendas"

supabase functions deploy hotmart-webhook
```

**Resultado esperado:**
```
Deploying hotmart-webhook (project ref: yvjzkhxczbxidtdmkafx)
Bundled hotmart-webhook in 450ms
Deployed hotmart-webhook to:
  https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/hotmart-webhook
```

**⚠️ COPIE A URL - você vai precisar dela para configurar na Hotmart!**

---

#### 4.1.4. Testar Localmente

**Criar payload de teste:**
```bash
cat > /tmp/test-hotmart.json << 'EOF'
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "teste@exemplo.com",
      "name": "JOAO DA SILVA SANTOS",
      "document": "12345678901",
      "checkout_phone_code": "55",
      "checkout_phone": "11987654321"
    },
    "product": {
      "id": 123456,
      "name": "Imersão Diagnóstico de Vendas"
    },
    "purchase": {
      "transaction": "HP999999TEST",
      "price": {
        "value": 1.00,
        "currency_code": "BRL"
      },
      "full_price": {
        "value": 997.00
      },
      "approved_date": 1706745600000
    }
  }
}
EOF
```

**Enviar teste:**
```bash
curl -X POST https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-secret-hotmart-2026" \
  -d @/tmp/test-hotmart.json
```

**Resultado esperado:**
```json
{
  "success": true,
  "result": {
    "user_id": "...",
    "product": "imersao-diagnostico-vendas",
    "xp_awarded": 100,
    "total_xp": 100
  }
}
```

**Verificar no banco:**
```sql
SELECT transaction_id, buyer_name, buyer_phone, status
FROM purchases
WHERE transaction_id = 'HP999999TEST';
```

**Resultado esperado:**
```
transaction_id  | buyer_name | buyer_phone      | status
----------------|------------|------------------|----------
HP999999TEST    | Joao       | 55 11987654321   | approved
```

**Nota:** `buyer_name` deve ser **"Joao"** (não "JOAO DA SILVA SANTOS") graças à função `formatFirstName()`.

---

#### 4.1.5. Ver Logs

```bash
supabase functions logs hotmart-webhook --tail
```

---

### 4.2. Audio Generation Function

#### 4.2.1. O que faz
- Recebe email + transaction_id do GHL
- Busca survey_response no Supabase
- Gera script personalizado via OpenAI o1-mini
- Converte para áudio via ElevenLabs TTS
- Upload do MP3 para Supabase Storage
- Retorna audio_url + script

**Documentação completa:** [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md)

---

#### 4.2.2. Configurar Secrets

```bash
# OpenAI
supabase secrets set OPENAI_API_KEY="sk-proj-r-_onE..."

# ElevenLabs
supabase secrets set ELEVENLABS_API_KEY="sk_88880a4e..."
supabase secrets set ELEVENLABS_VOICE_ID="K0Yk2ESZ2dsYv9RrtThg"
```

**Verificar:**
```bash
supabase secrets list
```

---

#### 4.2.3. Deploy

```bash
supabase functions deploy generate-audio
```

**Resultado esperado:**
```
Deployed generate-audio to:
  https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio
```

---

#### 4.2.4. Testar

```bash
curl -X POST https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "email-com-survey@exemplo.com",
    "ghl_contact_id": "test-123"
  }'
```

**Resultado esperado (~30-45s):**
```json
{
  "success": true,
  "audio_url": "https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/...",
  "script": "Fala, Marina! Aqui é o André...",
  "duration_seconds": 90
}
```

---

## 5. SECURITY DEPLOYMENT

### 5.1. Validation Function

Já executada na seção 3.1 (Migration 1).

**Função criada:**
```sql
public.is_valid_buyer(p_email TEXT, p_transaction_id TEXT, p_product_slug TEXT)
```

**Retorno:**
```
is_valid   | purchase_id | user_id | buyer_name | reason
-----------|-------------|---------|------------|-------
boolean    | UUID        | UUID    | TEXT       | TEXT
```

---

### 5.2. RLS Policies

Já executada na seção 3.1 (Migration 2).

**Policy criada:**
```sql
"Allow insert for verified buyers only" ON survey_responses
```

**Lógica:**
- Bloqueia insert se `is_valid_buyer()` retornar `false`
- Permite apenas compradores verificados

---

### 5.3. Manual Approval System

Já executada na seção 3.1 (Migration 3).

**Campo adicionado:**
```sql
purchases.manual_approval BOOLEAN DEFAULT false
```

**Uso:**
- Admin pode liberar acesso manualmente setando `manual_approval = true`
- Bypassa verificações de `status` e `product_slug`

**Como usar:**
```sql
UPDATE purchases
SET manual_approval = true
WHERE email = 'usuario-bloqueado@email.com';
```

---

## 6. HOTMART INTEGRATION

### 6.1. Configurar Webhook na Hotmart

**1. Acessar painel:**
- Vá em: https://app.hotmart.com
- Selecione o produto
- Vá em **Ferramentas** → **Webhooks**

**2. Adicionar webhook:**
- **URL do Webhook:**
  ```
  https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/hotmart-webhook
  ```
- **Eventos para monitorar:**
  - ✅ Compra aprovada (`PURCHASE_COMPLETE`)
  - ✅ Reembolso (`PURCHASE_REFUNDED`)
  - ✅ Compra cancelada (`PURCHASE_CANCELED`)
- **Salvar**

**3. Testar webhook (se disponível no painel):**
- Clique em "Testar Webhook"
- Deve retornar sucesso

---

### 6.2. Configurar Thank You Page

**1. Criar oferta de teste (R$ 1,00):**
- Produto: Imersão Diagnóstico de Vendas (ou nome equivalente)
- Preço: R$ 1,00
- **Thank You Page (URL de Redirecionamento):**
  ```
  https://app-diagnostico-vendas.vercel.app/obrigado?transaction={transaction_id}
  ```
  **⚠️ IMPORTANTE:** Use exatamente `transaction` (não `tx`)

**2. Copiar link de compra**

---

### 6.3. Fazer Compra Teste

**1. Abrir link em aba anônima**

**2. Preencher dados:**
- Email de teste (pode ser o seu)
- Dados do cartão
- Completar compra (R$ 1,00)

**3. Aguardar processamento (5-30 segundos):**
- Hotmart processa pagamento
- **Envia webhook** → Edge Function processa → Insere em `purchases` + dá XP
- **Redireciona** para `/obrigado?transaction=HP123456`

---

### 6.4. Validar Fluxo Completo

**1. Verificar logs da Edge Function:**
```bash
supabase functions logs hotmart-webhook --tail
```

**O que você deve ver:**
```
📦 Processing purchase: teste@exemplo.com | Imersão Diagnóstico de Vendas
✓ Product detected: imersao-diagnostico-vendas (+100 XP)
👤 Creating new user: teste@exemplo.com
✓ Purchase recorded: HP123456
✅ Purchase complete! teste@exemplo.com | imersao-diagnostico-vendas | +100 XP | Total: 100 XP
```

**2. Verificar no Supabase Dashboard:**

**Tabela `purchases`:**
```sql
SELECT * FROM purchases WHERE transaction_id = 'HP123456';
```

**Esperado:**
- `product_slug` = `imersao-diagnostico-vendas`
- `status` = `approved`
- `price` = `1.00`
- `buyer_name` = Primeiro nome em Title Case (ex: "Joao")

**Tabela `profiles`:**
```sql
SELECT * FROM profiles WHERE email = 'teste@exemplo.com';
```

**Esperado:**
- `xp` = `100`
- `completed_steps` contém `purchase-imersao`

**3. Verificar na Thank You Page:**
- Deve mostrar: "COMPRA IDENTIFICADA!" (em verde)
- Exibir: Pesquisa de calibragem (8 perguntas)
- Ao finalizar → Criar senha → Redirecionar para `/pre-evento`

**4. Verificar XP no app:**
- Login com email + senha criada
- Acesse: `/pre-evento`
- XP badge no topo deve mostrar **100 XP**

---

## 7. FRONTEND DEPLOYMENT (Vercel)

### 7.1. Deploy Automático

**Como funciona:**
1. Faça commit das mudanças:
   ```bash
   git add .
   git commit -m "feat: Implement feature X"
   git push origin main
   ```
2. Vercel detecta push automaticamente
3. Build e deploy (~2-3 minutos)
4. Acesse: https://app-diagnostico-vendas.vercel.app

---

### 7.2. Deploy Manual (Force Redeploy)

**Via Vercel Dashboard:**
1. Acesse: [Vercel Dashboard](https://vercel.com/dashboard)
2. Projeto: `app-diagnostico-vendas`
3. Clique em **"..."** → **Redeploy**
4. Aguarde build

**Ou via CLI:**
```bash
npm install -g vercel
vercel --prod
```

---

### 7.3. Environment Variables

**Acesse:** Vercel Dashboard → Settings → Environment Variables

**Variáveis necessárias:**
```
NEXT_PUBLIC_SUPABASE_URL=https://yvjzkhxczbxidtdmkafx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Após adicionar/editar env vars, faça redeploy!**

---

### 7.4. Verificar Deploy

**1. Acesse a URL de produção:**
```
https://app-diagnostico-vendas.vercel.app
```

**2. Teste páginas principais:**
- [ ] `/` - Landing page
- [ ] `/obrigado` - Thank You page
- [ ] `/pre-evento` - Preparação (requer login)
- [ ] `/ao-vivo` - Ao Vivo (requer login)
- [ ] `/pos-evento` - Pós Evento (requer login)
- [ ] `/admin` - Admin (requer admin role)

**3. Verificar console do navegador (F12):**
- Não deve ter erros críticos
- Conexão Supabase deve funcionar

---

## 8. TESTING & VALIDATION

### 8.1. Unit Tests (Validation Function)

**Teste 1: Comprador Válido ✅**
```sql
SELECT * FROM public.is_valid_buyer(
  'teste@exemplo.com',
  'HP123456',
  'imersao-diagnostico-vendas'
);
```

**Esperado:**
```
is_valid: true
reason: valid
```

**Teste 2: Email Válido, Transaction Errada ❌**
```sql
SELECT * FROM public.is_valid_buyer(
  'teste@exemplo.com',
  'TRANSACAO_INVALIDA',
  'imersao-diagnostico-vendas'
);
```

**Esperado:**
```
is_valid: false
reason: transaction_not_found
```

**Teste 3: Email Não-Comprador ❌**
```sql
SELECT * FROM public.is_valid_buyer(
  'naoe-comprador@teste.com',
  NULL,
  'imersao-diagnostico-vendas'
);
```

**Esperado:**
```
is_valid: false
reason: purchase_not_found
```

**Teste 4: Manual Approval Bypass ✅**
```sql
-- Setar manual_approval
UPDATE purchases SET manual_approval = true WHERE email = 'teste@exemplo.com';

-- Testar
SELECT * FROM public.is_valid_buyer(
  'teste@exemplo.com',
  NULL,
  'qualquer-produto'  -- Funciona mesmo com produto diferente
);
```

**Esperado:**
```
is_valid: true
reason: manual_approval
```

---

### 8.2. Integration Tests (Frontend)

**Teste 1: Thank You Page - Comprador Válido ✅**
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado?transaction=HP123456
Expected: Acesso completo → Survey → Senha → WhatsApp
```

**Teste 2: Thank You Page - Email Válido ✅**
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado
Ação: Digitar email de comprador válido
Expected: Verificação OK → Survey
```

**Teste 3: Thank You Page - Não-Comprador ❌**
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado
Ação: Digitar email random (naoe@teste.com)
Expected: Tela "Acesso Negado" + Botão suporte
```

**Teste 4: Botão Skip Removido ❌**
```
Ação: Aguardar 10s sem encontrar compra
Expected: Tela "Acesso Negado" (NÃO mostra "Continuar sem verificação")
```

---

### 8.3. E2E Validation (Complete Flow)

**Fluxo completo:**
1. [ ] Compra teste R$ 1 na Hotmart
2. [ ] Webhook processa e insere em `purchases`
3. [ ] Thank You Page identifica compra
4. [ ] Usuário preenche survey (8 questões)
5. [ ] Cria senha
6. [ ] Confirma WhatsApp
7. [ ] Redireciona para `/pre-evento`
8. [ ] XP aparece no badge (100 XP)
9. [ ] Step "Imersão" marcado como completo
10. [ ] Áudio personalizado gerado (se configurado GHL)

---

## 9. MONITORING

### 9.1. Logs do Supabase

**Edge Function logs:**
```bash
supabase functions logs hotmart-webhook --tail
supabase functions logs generate-audio --tail
```

**OU via dashboard:**
- Acesse: https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/logs/edge-functions

---

### 9.2. Database Monitoring

**Erros RLS nas últimas 24h:**
```sql
SELECT *
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND error_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

**Compras pendentes (não aprovadas):**
```sql
SELECT email, status, transaction_id, created_at
FROM purchases
WHERE status != 'approved'
  AND manual_approval = false
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Aprovações manuais:**
```sql
SELECT email, buyer_name, transaction_id, manual_approval, created_at
FROM purchases
WHERE manual_approval = true
ORDER BY created_at DESC;
```

**Áudios gerados:**
```sql
SELECT
  COUNT(*) as total_audios,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  AVG(audio_duration_seconds) as avg_duration
FROM survey_audio_files
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

### 9.3. Vercel Logs

**Acesse:**
- Dashboard: https://vercel.com/dashboard
- Projeto: `app-diagnostico-vendas`
- Aba: **Logs**
- Filtrar por: Errors, Warnings

---

## 10. ROLLBACK PROCEDURES

### 10.1. Frontend Rollback

**Opção 1: Git Revert**
```bash
git revert HEAD
git push origin main
# Aguardar redeploy (2-3 min)
```

**Opção 2: Vercel Rollback**
1. Acesse: Vercel Dashboard → Deployments
2. Encontre deployment anterior que funcionava
3. Clique em "..." → Promote to Production

---

### 10.2. Database Rollback

**⚠️ CUIDADO: Rollback de banco pode causar perda de dados!**

**Rollback RLS (Temporário - INSEGURO):**
```sql
-- Volta para permissivo
DROP POLICY IF EXISTS "Allow insert for verified buyers only"
  ON public.survey_responses;

CREATE POLICY "Allow public insert"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);
```

**Rollback Manual Approval:**
```sql
ALTER TABLE purchases DROP COLUMN IF EXISTS manual_approval;
```

---

### 10.3. Edge Function Rollback

**1. Reverter código localmente:**
```bash
git checkout HEAD~1 -- supabase/functions/hotmart-webhook/
```

**2. Re-deploy:**
```bash
supabase functions deploy hotmart-webhook
```

**3. Verificar logs:**
```bash
supabase functions logs hotmart-webhook --tail
```

---

## 11. TROUBLESHOOTING

### 11.1. Erros Comuns - Database

**Erro: "Function already exists"**
- **Causa:** Função já foi criada antes
- **Solução:** Normal, vai sobrescrever. Pode ignorar.

**Erro: "Policy already exists"**
- **Causa:** Policy duplicada
- **Solução:**
  ```sql
  DROP POLICY IF EXISTS "Allow insert for verified buyers only"
    ON public.survey_responses;
  -- Re-executar migration 2
  ```

**Erro: "Column already exists"**
- **Causa:** Campo já foi adicionado
- **Solução:** Normal, `IF NOT EXISTS` ignora. Pode continuar.

---

### 11.2. Erros Comuns - Edge Functions

**Erro: "Access token not provided"**
- **Causa:** Não está logado no Supabase CLI
- **Solução:**
  ```bash
  supabase login
  ```

**Erro: "Invalid signature" (hotmart-webhook)**
- **Causa:** `HOTMART_WEBHOOK_SECRET` incorreto
- **Solução:**
  ```bash
  supabase secrets list
  supabase secrets set HOTMART_WEBHOOK_SECRET="seu-hottok-correto"
  ```

**Erro: "Survey não encontrado" (generate-audio)**
- **Causa:** Usuário ainda não completou pesquisa
- **Solução:** Aguardar usuário preencher survey ou usar email válido no teste

**Erro: "401 Unauthorized" (generate-audio)**
- **Causa:** Token truncado ou errado
- **Solução:** Verificar Authorization header está completo (500+ caracteres)

---

### 11.3. Erros Comuns - Frontend

**Erro: "Frontend não atualizou"**
- **Causa:** Cache do Vercel
- **Solução:**
  - Hard refresh: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
  - Ou limpar cache do navegador

**Erro: "RLS bloqueando compradores válidos"**
- **Causa:** Migration 2 não aplicada corretamente
- **Solução:**
  ```sql
  -- Ver policies ativas
  SELECT * FROM pg_policies WHERE tablename = 'survey_responses';

  -- Se não houver policy, re-executar migration 2
  ```

---

### 11.4. Erros Comuns - Hotmart

**Erro: "Webhook não está sendo chamado"**
- **Causa:** URL incorreta no painel Hotmart
- **Solução:**
  - Verificar URL no painel Hotmart
  - Testar com curl manual
  - Ver logs: `supabase functions logs hotmart-webhook --tail`

**Erro: "Thank You Page não encontra a compra"**
- **Causa:** Hotmart demora para enviar webhook
- **Solução:**
  - Aguardar 10-30 segundos
  - Verificar logs do webhook
  - Confirmar `transaction_id` está em `purchases`

**Erro: "XP não aparece no app"**
- **Causa:** Cache do navegador
- **Solução:**
  - Fazer logout e login novamente
  - Verificar `profiles.xp` no Supabase Dashboard
  - Confirmar `completed_steps` contém step correto

---

## 12. SUPPORT & MANUAL OVERRIDES

### 12.1. Manual Approval (Liberar Acesso Manualmente)

**Quando usar:**
- Comprador válido está bloqueado por algum motivo
- Status da compra != `approved` mas pagamento foi confirmado
- Erro no processamento do webhook

**Como fazer:**

**1. Verificar compra:**
```sql
SELECT * FROM purchases WHERE email = 'usuario@email.com';
```

**2. Se compra existe mas status != 'approved':**
```sql
-- Liberar manualmente
UPDATE purchases
SET manual_approval = true
WHERE email = 'usuario@email.com';
```

**3. Avisar usuário:**
```
Olá! Liberamos seu acesso manualmente.
Por favor, tente novamente pelo link: https://app-diagnostico-vendas.vercel.app/obrigado
```

**4. Log do caso:**
- Anotar email
- Motivo do bloqueio
- Ação tomada (manual_approval)

---

### 12.2. Atualizar Compra Existente

**Problema:** Compra antiga tem nome completo em maiúsculas.

**Solução:**
```sql
-- Atualizar buyer_name para apenas primeiro nome
UPDATE purchases
SET buyer_name = 'Andre'  -- Substituir pelo primeiro nome correto
WHERE transaction_id = 'HP0603054387';

-- Verificar
SELECT transaction_id, buyer_name FROM purchases WHERE transaction_id = 'HP0603054387';
```

---

### 12.3. Emergency Rollback (Bloqueio Total)

**Se houver problema crítico bloqueando TODOS os usuários:**

**1. Rollback Frontend (mais seguro):**
```bash
git revert HEAD
git push origin main
# Aguardar redeploy (2-3 min)
```

**2. Rollback RLS (INSEGURO - apenas temporário):**
```sql
-- ⚠️ VOLTA PARA PERMISSIVO
DROP POLICY IF EXISTS "Allow insert for verified buyers only"
  ON public.survey_responses;

CREATE POLICY "Allow public insert"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);
```

**⚠️ Após rollback:**
1. Investigar logs
2. Identificar issue
3. Corrigir e re-testar
4. Re-deploy

---

## 📞 CONTATOS

**Suporte Técnico:**
- Dev: [seu contato]
- Supabase Dashboard: https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx
- Vercel Dashboard: https://vercel.com/dashboard

---

## ✅ CHECKLIST FINAL DE DEPLOY

### Database
- [x] Migration 1: Validation Function
- [x] Migration 2: RLS Policy
- [x] Migration 3: Manual Approval
- [x] Migration 4: Event State
- [x] Migration 5: Tab Access Control
- [x] Migration 6: Offer Links
- [x] Migration 7: Survey Audio Files
- [x] Verificações de banco OK

### Edge Functions
- [x] hotmart-webhook deployado
- [x] generate-audio deployado
- [x] Secrets configurados (Hotmart, OpenAI, ElevenLabs)
- [x] Testes locais OK
- [x] Logs sem erros

### Hotmart
- [x] Webhook configurado no painel
- [x] Thank You Page configurada
- [x] Compra teste realizada (R$ 1)
- [x] Fluxo completo validado

### Frontend
- [x] Deploy automático configurado (git push)
- [x] Environment variables configuradas
- [x] Testes de páginas OK
- [x] Console sem erros críticos

### Monitoring
- [x] Logs do Supabase monitorados
- [x] Logs do Vercel monitorados
- [x] Queries de verificação salvas
- [x] Alertas configurados (opcional)

---

**Desenvolvido por:** Claude Code
**Data:** 2026-01-31
**Última Atualização:** 2026-02-03
**Status:** ✅ PRONTO PARA PRODUÇÃO
