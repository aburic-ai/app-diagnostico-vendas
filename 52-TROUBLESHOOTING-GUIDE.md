# 52. GUIA DE TROUBLESHOOTING

**Última Atualização:** 2026-02-03
**Status:** Completo e Testado

---

## 📋 ÍNDICE

1. [Como Usar Este Guia](#como-usar-este-guia)
2. [Por Feature](#por-feature)
3. [Por Tipo de Erro](#por-tipo-de-erro)
4. [Por Componente](#por-componente)
5. [Problemas Críticos](#problemas-criticos)
6. [Procedimentos de Emergência](#procedimentos-de-emergencia)

---

## 1. COMO USAR ESTE GUIA

### Estrutura

Este guia está organizado em 3 formas diferentes para facilitar a busca:

**1. Por Feature** - Se você sabe qual funcionalidade está com problema (ex: "áudio não está funcionando")
**2. Por Tipo de Erro** - Se você tem uma mensagem de erro específica (ex: "401 Unauthorized")
**3. Por Componente** - Se você sabe qual parte do sistema está falhando (ex: "Edge Function")

### Como Navegar

1. **Se você tem uma mensagem de erro:** Procure em "Por Tipo de Erro"
2. **Se algo não está funcionando:** Procure em "Por Feature"
3. **Se um serviço está falhando:** Procure em "Por Componente"

---

## 2. POR FEATURE

### 2.1. SISTEMA DE ÁUDIO

#### Problema: Edge Function demora muito (> 45s)

**Sintomas:**
- Timeout após 30-45 segundos
- GHL não recebe resposta
- Áudio não é gerado

**Causas possíveis:**
1. OpenAI ou ElevenLabs lentos
2. Timeout configurado muito baixo no GHL
3. Quotas de API atingidas

**Solução:**
```bash
# 1. Verificar timeout no GHL
# Configurar HTTP Request timeout para 60s ou 90s

# 2. Verificar logs da Edge Function
supabase functions logs generate-audio --tail

# 3. Verificar quotas OpenAI
# https://platform.openai.com/account/usage

# 4. Verificar quotas ElevenLabs
# https://elevenlabs.io/app/usage
```

**Workaround temporário:**
- Implementar timeout de 25s
- Se ultrapassar, usar script fallback genérico
- Processar áudio em background

---

#### Problema: GHL não recebe response

**Sintomas:**
- Workflow 2 não completa
- Custom field `audio_url` vazio
- Logs do GHL mostram erro

**Causas possíveis:**
1. Edge Function retorna erro
2. URL incorreta no GHL
3. Token de autenticação inválido

**Solução:**
```bash
# 1. Verificar logs do Supabase
supabase functions logs generate-audio --tail

# 2. Testar Edge Function manualmente
curl -X POST https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGci..." \
  -d '{
    "email": "teste@exemplo.com",
    "ghl_contact_id": "test-123"
  }'

# 3. Verificar se variáveis de ambiente estão configuradas
supabase secrets list
```

---

#### Problema: Áudio não toca como nativo no WhatsApp

**Sintomas:**
- Áudio chega como link ou documento
- Não aparece como voice message
- Usuário precisa baixar para ouvir

**Causas possíveis:**
1. URL incorreta ou inacessível
2. MIME type errado
3. GHL configurado como "Document" ao invés de "Audio"

**Solução:**
```bash
# 1. Verificar URL pública
# Abrir URL no navegador, deve tocar o áudio

# 2. Verificar MIME type
curl -I https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/...
# Deve retornar: Content-Type: audio/mpeg

# 3. Verificar configuração no GHL
# Action: Send WhatsApp Message
# Type: Audio (NÃO Document)
# URL: {{contact.audio_imdiagnvendas_url}}
```

---

#### Erro: "Email não encontrado" ou "Survey não encontrado"

**Sintomas:**
```json
{
  "success": false,
  "reason": "survey_not_found"
}
```

**Causas possíveis:**
1. Usando `{{contact.email}}` ao invés de `{{body.buyer.email}}`
2. Usuário ainda não completou a pesquisa
3. Email no GHL diferente do email usado na compra

**Solução:**
```bash
# 1. Verificar Custom Data do webhook no GHL
# Deve usar: {{body.buyer.email}} (NÃO {{contact.email}})

# 2. Verificar no banco se existe survey para esse email
supabase db connect
```

```sql
SELECT * FROM survey_responses WHERE email = 'teste@exemplo.com';
```

**Se não houver resultado:**
- Usuário precisa completar a pesquisa primeiro
- Ou email está diferente (verificar typo)

---

#### Erro: "401 Unauthorized"

**Sintomas:**
- HTTP Request retorna erro 401
- Edge Function rejeita chamada
- Logs mostram "Unauthorized"

**Causas possíveis:**
1. Token truncado (falta parte do token)
2. Token errado (usando service_role ao invés de anon)

**Solução:**
```bash
# Verificar Authorization header no GHL está COMPLETO (500+ caracteres)

# Token correto:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4
```

**⚠️ COPIE O TOKEN COMPLETO! Não truncar.**

---

#### Erro: Custom Fields não atualizam

**Sintomas:**
- Workflow executa mas `audio_diagnosticovendas_url` continua vazio
- Custom field não é preenchido
- Áudio não é enviado

**Causas possíveis:**
1. Variável errada: `{{webhook.audio_url}}` ao invés de `{{webhook_response.audio_url}}`
2. Nome do custom field errado (typo)
3. Webhook retornou erro mas GHL continuou

**Solução:**
```bash
# 1. No GHL, clicar em "Insert Variable" e usar autocomplete
# Descobrir nome correto da variável (pode ser webhook_response, Webhook, ou response)

# 2. Verificar logs do workflow no GHL
# Resposta do webhook deve ter: success: true

# 3. Verificar custom field existe com nome EXATO
# Nome correto: audio_diagnosticovendas_url
```

---

#### Erro: Timeout (Request demora mais de 30s)

**Sintomas:**
- "Request timeout" após 30 segundos
- GHL cancela request
- Áudio não é gerado

**Causas possíveis:**
1. Timeout padrão do GHL muito baixo (30s)
2. OpenAI ou ElevenLabs lentos

**Solução:**
```bash
# Configurar timeout do HTTP Request no GHL
# Settings → Timeout: 60000 (60s) ou 90000 (90s)

# Verificar logs da Edge Function para ver onde está demorando
supabase functions logs generate-audio --tail
```

---

#### Erro: Webhook não dispara

**Sintomas:**
- Workflow 2 nunca inicia
- Usuário completa survey mas nada acontece
- GHL não recebe payload

**Causas possíveis:**
1. URL do webhook incorreta
2. `ThankYou.tsx` não está chamando webhook
3. CORS bloqueando request

**Solução:**
```bash
# 1. Verificar URL do trigger no GHL
# Deve ser: https://services.leadconnectorhq.com/hooks/R2mu3tVVjKvafx2O2wlw/webhook-trigger/uMAGh6b3u7aHWBn2sH6f

# 2. Verificar console do navegador (F12) quando enviar survey
# Deve mostrar POST request com status 200

# 3. Ver logs do GHL
# GHL Dashboard → Workflows → Activity
```

---

### 2.2. SISTEMA DE COMPRAS (HOTMART)

#### Erro: "Webhook não está sendo chamado"

**Sintomas:**
- Compra feita mas não aparece no banco
- `purchases` não tem novo registro
- Logs não mostram processamento

**Causas possíveis:**
1. URL incorreta no painel Hotmart
2. Produto não está configurado
3. Webhook Hotmart desabilitado

**Solução:**
```bash
# 1. Verificar URL no painel Hotmart
# Hotmart → Ferramentas → Webhooks
# URL: https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/hotmart-webhook

# 2. Testar com curl manual
curl -X POST https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-secret-hotmart-2026" \
  -d @test-payload.json

# 3. Ver logs
supabase functions logs hotmart-webhook --tail
```

---

#### Erro: "Thank You Page não encontra a compra"

**Sintomas:**
- Thank You page mostra "Acesso Negado"
- Compra foi feita mas não valida
- `is_valid_buyer()` retorna false

**Causas possíveis:**
1. Hotmart demora para enviar webhook (5-30s)
2. Transaction ID incorreto na URL
3. Email diferente entre Hotmart e tentativa de acesso

**Solução:**
```bash
# 1. Aguardar 10-30 segundos após compra
# Webhook pode demorar para processar

# 2. Verificar logs do webhook
supabase functions logs hotmart-webhook --tail

# 3. Confirmar transaction_id está em purchases
```

```sql
SELECT * FROM purchases WHERE transaction_id = 'HP123456';
```

**Se não houver resultado:**
- Webhook ainda não processou (aguardar)
- Ou transaction_id está incorreto

---

#### Erro: "XP não aparece no app"

**Sintomas:**
- Compra processada
- Profile criado
- Mas XP badge mostra 0

**Causas possíveis:**
1. Cache do navegador
2. XP não foi atribuído no webhook
3. Profile não foi atualizado

**Solução:**
```bash
# 1. Fazer logout e login novamente
# Limpa cache e recarrega profile

# 2. Verificar profiles.xp no Supabase Dashboard
```

```sql
SELECT email, xp, completed_steps
FROM profiles
WHERE email = 'teste@exemplo.com';
```

**Se XP = 0:**
- Verificar logs do webhook
- Pode ter havido erro ao atribuir XP

---

#### Erro: "Invalid signature" (hotmart-webhook)

**Sintomas:**
- Edge Function retorna 401
- "Invalid Hottok" nos logs
- Webhook rejeita chamadas da Hotmart

**Causas possíveis:**
1. `HOTMART_WEBHOOK_SECRET` incorreto
2. Hottok mudou no painel Hotmart
3. Header `X-Hotmart-Hottok` incorreto

**Solução:**
```bash
# 1. Verificar secret configurado
supabase secrets list

# 2. Obter Hottok correto da Hotmart
# Hotmart → Ferramentas → Webhooks → Copiar Hottok

# 3. Atualizar secret
supabase secrets set HOTMART_WEBHOOK_SECRET="seu-hottok-correto"

# 4. Re-deploy
supabase functions deploy hotmart-webhook
```

---

### 2.3. CONTROLE DE ACESSO ÀS ABAS

#### Problema: Participante não consegue acessar aba mesmo após horário

**Sintomas:**
- Tela "Aba Bloqueada" aparece
- Horário de liberação já passou
- Participante deveria ter acesso

**Causas possíveis:**
1. Toggle manual está desligado
2. `unlock_date` incorreta
3. `lock_date` já passou
4. Timezone incorreto (não é -03:00 Brasil)

**Solução:**
```bash
# 1. Verificar no Admin se toggle está ligado
# Admin → Liberação de Abas → Verificar círculo azul

# 2. Verificar no banco se unlock_date está correto
```

```sql
SELECT
  pre_evento_enabled,
  pre_evento_unlock_date,
  pre_evento_lock_date,
  ao_vivo_enabled,
  ao_vivo_unlock_date,
  ao_vivo_lock_date,
  pos_evento_enabled,
  pos_evento_unlock_date,
  pos_evento_lock_date
FROM event_state LIMIT 1;
```

**Se datas estiverem erradas:**
- Corrigir no Admin e salvar
- Ou atualizar diretamente no banco

---

#### Problema: Admin não consegue salvar configurações

**Sintomas:**
- Botão "SALVAR" não responde
- Toast de erro aparece
- Mudanças não persistem

**Causas possíveis:**
1. Migration não foi executada
2. RLS bloqueando admin
3. Erro no hook `updateEventState`

**Solução:**
```bash
# 1. Verificar se migration foi executada
```

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'event_state'
  AND column_name LIKE '%evento%';
```

**Deve retornar 9 colunas** (pre_evento_enabled, etc.)

```bash
# 2. Verificar console do navegador (F12) para erros

# 3. Verificar se user é admin
```

```sql
SELECT email, is_admin FROM profiles WHERE email = 'seu-email@admin.com';
```

---

#### Problema: Mudanças não sincronizam em tempo real

**Sintomas:**
- Admin salva configurações
- Participantes não veem mudanças
- Precisa recarregar página (F5)

**Causas possíveis:**
1. Supabase Realtime não está ativo
2. Subscription não está funcionando
3. Hook `useEventState` não está ouvindo mudanças

**Solução:**
```bash
# 1. Verificar Supabase Realtime no useEventState
# Deve ter subscription ativa para event_state

# 2. Verificar console logs
# Deve mostrar: "Event state updated: ..."

# 3. Force refresh: F5 na página do participante
```

---

### 2.4. VALIDAÇÃO DE COMPRAS

#### Erro: "RLS bloqueando compradores válidos"

**Sintomas:**
- Comprador válido não consegue inserir survey
- `is_valid_buyer()` retorna true mas insert falha
- Error 42501: permission denied

**Causas possíveis:**
1. Migration 2 (RLS policy) não aplicada corretamente
2. Policy mal configurada
3. Função `is_valid_buyer()` com bug

**Solução:**
```bash
# 1. Ver policies ativas
```

```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses';
```

**Deve retornar:**
```
policyname: "Allow insert for verified buyers only"
cmd: INSERT
qual: (SELECT is_valid FROM public.is_valid_buyer(...))
```

**Se não houver policy:**
- Re-executar migration 2: `fix-survey-responses-rls-v2.sql`

---

#### Problema: Manual Approval não funciona

**Sintomas:**
- `manual_approval = true` setado
- Mas usuário continua bloqueado
- `is_valid_buyer()` retorna false

**Causas possíveis:**
1. Campo `manual_approval` não existe
2. Migration 3 não foi executada
3. Lógica da função não considera manual_approval

**Solução:**
```bash
# 1. Verificar se coluna existe
```

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'purchases'
  AND column_name = 'manual_approval';
```

**Se não existir:**
- Executar migration 3: `supabase-migrations-purchases-v3.sql`

```bash
# 2. Verificar valor no banco
```

```sql
SELECT email, manual_approval, status
FROM purchases
WHERE email = 'usuario@email.com';
```

**Se manual_approval = false:**
```sql
UPDATE purchases
SET manual_approval = true
WHERE email = 'usuario@email.com';
```

---

### 2.5. EDGE FUNCTIONS

#### Erro: "Access token not provided"

**Sintomas:**
- `supabase functions deploy` falha
- "Access token not provided"
- CLI não consegue autenticar

**Causas possíveis:**
1. Não está logado no Supabase CLI
2. Token expirou
3. Environment variable `SUPABASE_ACCESS_TOKEN` vazia

**Solução:**
```bash
# 1. Login no Supabase
supabase login

# 2. OU configurar token manualmente
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"

# 3. Verificar autenticação
supabase projects list
```

---

#### Erro: Edge Function não responde (timeout)

**Sintomas:**
- Request para Edge Function demora muito
- Timeout após 30-60s
- Não retorna resposta

**Causas possíveis:**
1. Função tem loop infinito
2. API externa (OpenAI, ElevenLabs) está lenta
3. Quotas atingidas

**Solução:**
```bash
# 1. Ver logs em tempo real
supabase functions logs nome-da-funcao --tail

# 2. Verificar quotas APIs externas
# OpenAI: https://platform.openai.com/account/usage
# ElevenLabs: https://elevenlabs.io/app/usage

# 3. Testar localmente
supabase functions serve nome-da-funcao
curl http://localhost:54321/functions/v1/nome-da-funcao
```

---

### 2.6. FRONTEND (VERCEL)

#### Erro: "Frontend não atualizou"

**Sintomas:**
- Fez deploy mas mudanças não aparecem
- Site ainda mostra versão antiga
- Cache do Vercel

**Causas possíveis:**
1. Cache do navegador
2. Vercel CDN cache
3. Deploy ainda está rodando

**Solução:**
```bash
# 1. Hard refresh no navegador
# Windows: Ctrl+Shift+R
# Mac: Cmd+Shift+R

# 2. Ou limpar cache do navegador
# Settings → Privacy → Clear browsing data

# 3. Verificar deploy no Vercel
# https://vercel.com/dashboard
# Ver status do último deploy (deve estar "Ready")

# 4. Force redeploy
# Vercel Dashboard → ... → Redeploy
```

---

#### Problema: Environment variables não funcionam

**Sintomas:**
- `VITE_SUPABASE_URL` undefined
- App não conecta ao Supabase
- Console mostra erros de autenticação

**Causas possíveis:**
1. Env vars não configuradas no Vercel
2. Precisa de redeploy após adicionar env vars
3. Nome incorreto (deve começar com `VITE_`)

**Solução:**
```bash
# 1. Verificar env vars no Vercel
# Vercel Dashboard → Settings → Environment Variables
# Deve ter:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY

# 2. Após adicionar/editar, fazer redeploy
# Vercel não aplica env vars automaticamente

# 3. Verificar nome correto
# Vite requer prefixo VITE_ para expor variável ao frontend
```

---

## 3. POR TIPO DE ERRO

### 3.1. ERROS HTTP

#### 401 Unauthorized

**Onde aparece:** Edge Functions, Supabase API

**Causas comuns:**
- Token de autenticação inválido ou truncado
- Token expirado
- Permissões RLS incorretas

**Solução:** Ver seção [2.1 - Erro: "401 Unauthorized"](#erro-401-unauthorized)

---

#### 403 Forbidden

**Onde aparece:** RLS policies, Storage buckets

**Causas comuns:**
- RLS policy bloqueando operação
- Usuário não tem permissão
- Bucket storage não é público

**Solução:**
```bash
# Verificar RLS policies
```

```sql
SELECT * FROM pg_policies WHERE tablename = 'nome-da-tabela';
```

---

#### 404 Not Found

**Onde aparece:** API endpoints, Storage files

**Causas comuns:**
- URL incorreta
- Recurso não existe
- Path errado

**Solução:**
```bash
# Verificar URL
# Deve ser:
# - Edge Function: https://PROJECT_REF.supabase.co/functions/v1/function-name
# - Storage: https://PROJECT_REF.supabase.co/storage/v1/object/public/bucket-name/file-path
```

---

#### 500 Internal Server Error

**Onde aparece:** Edge Functions, Supabase API

**Causas comuns:**
- Bug no código da Edge Function
- Erro no banco (constraint violation)
- API externa falhou

**Solução:**
```bash
# Ver logs para identificar erro exato
supabase functions logs nome-da-funcao --tail
```

---

### 3.2. ERROS DE DATABASE

#### 42703: column does not exist

**Sintomas:**
```
ERROR: 42703: column "offer_unlocked" of relation "public.event_state" does not exist
```

**Causa:** Migration não foi executada ou falhou

**Solução:**
```bash
# Verificar se coluna existe
```

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'event_state';
```

**Se não existir:**
- Executar migration correspondente
- Ver: [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md#3-database-migrations)

---

#### 23505: duplicate key value violates unique constraint

**Sintomas:**
```
ERROR: 23505: duplicate key value violates unique constraint "purchases_transaction_id_key"
```

**Causa:** Tentando inserir registro duplicado (transaction_id já existe)

**Solução:**
```bash
# Verificar se registro já existe
```

```sql
SELECT * FROM purchases WHERE transaction_id = 'HP123456';
```

**Se existir:**
- Update ao invés de insert
- Ou verificar lógica no Edge Function

---

#### 42501: permission denied for table

**Sintomas:**
```
ERROR: 42501: permission denied for table survey_responses
```

**Causa:** RLS policy bloqueando operação

**Solução:** Ver seção [2.4 - Erro: "RLS bloqueando compradores válidos"](#erro-rls-bloqueando-compradores-validos)

---

### 3.3. ERROS DE JAVASCRIPT

#### Cannot read property 'X' of undefined

**Onde aparece:** Frontend (React)

**Causas comuns:**
- Objeto não carregou ainda
- API retornou null
- Acesso a nested property sem verificação

**Solução:**
```typescript
// ❌ Errado
const name = user.profile.name

// ✅ Correto
const name = user?.profile?.name || 'Guest'
```

---

#### Network request failed

**Onde aparece:** Frontend (fetch, axios)

**Causas comuns:**
- CORS bloqueando
- URL incorreta
- Serviço offline

**Solução:**
```bash
# 1. Verificar console (F12) para detalhes do erro

# 2. Verificar CORS headers no servidor
# Edge Functions devem incluir:
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

# 3. Testar URL com curl
curl -I https://url-do-endpoint.com
```

---

## 4. POR COMPONENTE

### 4.1. SUPABASE

#### Database Connection Issues

**Sintomas:**
- App não conecta ao banco
- Queries falham
- Timeout em operações

**Solução:**
```bash
# 1. Verificar URL e chave estão corretas
# .env.local (development)
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# 2. Testar conexão
```

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Testar
const { data, error } = await supabase.from('profiles').select('count')
console.log(data, error)
```

---

#### Realtime Subscription não funciona

**Sintomas:**
- Mudanças no banco não atualizam frontend
- Subscription não recebe eventos
- Console não mostra logs de subscription

**Solução:**
```bash
# 1. Verificar Realtime está habilitado
# Supabase Dashboard → Database → Replication
# Marcar tabelas: profiles, event_state, notifications

# 2. Verificar subscription no código
```

```typescript
const subscription = supabase
  .channel('event_state')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'event_state'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe((status) => {
    console.log('Subscription status:', status)
  })

// Deve mostrar: status: "SUBSCRIBED"
```

---

### 4.2. VERCEL

#### Build Failures

**Sintomas:**
- Deploy falha na fase de build
- "Build failed" no dashboard
- Erro de compilação TypeScript

**Solução:**
```bash
# 1. Ver logs no Vercel Dashboard
# Vercel → Deployments → [deployment] → View Build Logs

# 2. Reproduzir erro localmente
npm run build

# 3. Verificar erros de TypeScript
npm run type-check
# Ou
npx tsc --noEmit

# 4. Fixar erros e fazer commit
git add .
git commit -m "fix: resolve build errors"
git push origin main
```

---

#### Domain/SSL Issues

**Sintomas:**
- Site não abre
- Certificado SSL inválido
- ERR_SSL_VERSION_OR_CIPHER_MISMATCH

**Solução:**
```bash
# 1. Verificar domain settings no Vercel
# Vercel Dashboard → Settings → Domains

# 2. Verificar DNS propagation
# https://dnschecker.org
# Deve apontar para Vercel (76.76.21.21)

# 3. Aguardar SSL provisioning
# Pode demorar até 24h após adicionar domínio

# 4. Force SSL renewal
# Vercel Dashboard → Domains → ... → Renew Certificate
```

---

### 4.3. OPENAI API

#### Rate Limit Exceeded

**Sintomas:**
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "type": "rate_limit_error"
  }
}
```

**Solução:**
```bash
# 1. Verificar usage
# https://platform.openai.com/account/usage

# 2. Upgrade plan se necessário
# https://platform.openai.com/account/billing/overview

# 3. Implementar retry com backoff
```

```typescript
async function generateWithRetry(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create({ ... })
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await sleep(2 ** i * 1000) // Exponential backoff
        continue
      }
      throw error
    }
  }
}
```

---

### 4.4. ELEVENLABS

#### Quota Exceeded

**Sintomas:**
```json
{
  "detail": {
    "status": "quota_exceeded",
    "message": "You have exceeded your character quota"
  }
}
```

**Solução:**
```bash
# 1. Verificar usage
# https://elevenlabs.io/app/usage

# 2. Upgrade plan
# Professional: 500K chars/mês ($99/mês)
# Enterprise: Unlimited

# 3. Workaround: Usar script de texto
# Se ElevenLabs falhar, enviar script por texto ao invés de áudio
```

---

### 4.5. GO HIGH LEVEL

#### Workflow não dispara

**Sintomas:**
- Trigger configurado mas nada acontece
- Logs não mostram execução
- Webhook não recebe payload

**Solução:**
```bash
# 1. Verificar Workflow está ATIVO
# GHL Dashboard → Automation → Workflows
# Status deve ser "Active" (toggle verde)

# 2. Verificar trigger URL
# Deve ser o webhook URL correto

# 3. Testar com Postman/curl
curl -X POST https://services.leadconnectorhq.com/hooks/.../webhook-trigger/... \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'

# 4. Ver Activity log
# GHL → Workflows → Activity
```

---

## 5. PROBLEMAS CRÍTICOS

### 5.1. SISTEMA COMPLETAMENTE OFFLINE

**Sintomas:**
- Site não abre
- 502 Bad Gateway ou 503 Service Unavailable
- Usuários não conseguem acessar

**Procedimento de Emergência:**

```bash
# 1. Verificar status da Vercel
# https://www.vercel-status.com

# 2. Verificar status do Supabase
# https://status.supabase.com

# 3. Se Vercel está OK, verificar último deploy
# Vercel Dashboard → Deployments
# Fazer rollback para deployment anterior que funcionava

# 4. Se Supabase está OK, verificar se DATABASE_URL está correta
# Vercel → Settings → Environment Variables

# 5. Notificar usuários
# Via email/WhatsApp sobre o incidente
```

---

### 5.2. RLS BLOQUEANDO TODOS OS USUÁRIOS

**Sintomas:**
- Ninguém consegue inserir surveys
- 100% dos acessos bloqueados
- `is_valid_buyer()` retornando false para todos

**Procedimento de Emergência:**

```sql
-- ⚠️ TEMPORÁRIO - INSEGURO!
-- Remove validação de compra temporariamente

DROP POLICY IF EXISTS "Allow insert for verified buyers only"
  ON public.survey_responses;

CREATE POLICY "Allow public insert - TEMPORARY"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);
```

**Após resolver o problema:**
```sql
-- Restaurar policy segura
DROP POLICY IF EXISTS "Allow public insert - TEMPORARY"
  ON public.survey_responses;

-- Re-executar migration 2
-- Copiar conteúdo de: fix-survey-responses-rls-v2.sql
```

---

### 5.3. EDGE FUNCTION FALHANDO 100%

**Sintomas:**
- Todos os requests para Edge Function falham
- 500 Internal Server Error
- Logs mostram crash

**Procedimento de Emergência:**

```bash
# 1. Ver últimos logs
supabase functions logs nome-da-funcao --tail

# 2. Identificar erro crítico
# Se for bug no código:

# 3. Reverter para versão anterior
git checkout HEAD~1 -- supabase/functions/nome-da-funcao/

# 4. Re-deploy
supabase functions deploy nome-da-funcao

# 5. Verificar funcionamento
curl https://PROJECT_REF.supabase.co/functions/v1/nome-da-funcao

# 6. Notificar usuários se houver impacto
```

---

## 6. PROCEDIMENTOS DE EMERGÊNCIA

### 6.1. Rollback Frontend (Vercel)

**Quando usar:** Deploy quebrou o site

```bash
# Opção 1: Git Revert
git revert HEAD
git push origin main
# Aguardar redeploy automático (2-3 min)

# Opção 2: Vercel Rollback
# 1. Acesse: Vercel Dashboard → Deployments
# 2. Encontre deployment anterior que funcionava
# 3. Clique em "..." → Promote to Production
```

---

### 6.2. Rollback Database (CUIDADO!)

**⚠️ ATENÇÃO:** Rollback de banco pode causar perda de dados!

```sql
-- Exemplo: Remover coluna adicionada em migration recente
ALTER TABLE event_state DROP COLUMN IF EXISTS nova_coluna;

-- Exemplo: Dropar tabela criada recentemente
DROP TABLE IF EXISTS nova_tabela CASCADE;
```

**Antes de fazer rollback:**
1. Fazer backup completo
2. Documentar exatamente o que vai reverter
3. Avisar time
4. Fazer em horário de baixo tráfego

---

### 6.3. Liberar Acesso Manualmente (Override)

**Quando usar:** Comprador válido está bloqueado por bug

```sql
-- Liberar acesso via manual_approval
UPDATE purchases
SET manual_approval = true
WHERE email = 'usuario@email.com';

-- Verificar
SELECT * FROM public.is_valid_buyer(
  'usuario@email.com',
  NULL,
  'imersao-diagnostico-vendas'
);
-- Deve retornar: is_valid = true, reason = 'manual_approval'
```

**Avisar usuário:**
```
Olá! Liberamos seu acesso manualmente.
Por favor, tente novamente pelo link:
https://app-diagnostico-vendas.vercel.app/obrigado
```

---

### 6.4. Desabilitar Feature Com Problema

**Quando usar:** Feature específica está falhando mas resto do app funciona

**Exemplos:**

**Desabilitar Assistente IA:**
```sql
UPDATE event_state SET ai_enabled = false;
```

**Desabilitar geração de áudio (fallback para texto):**
```typescript
// Edge Function generate-audio
// Adicionar no início:
return new Response(
  JSON.stringify({
    success: false,
    reason: 'audio_generation_temporarily_disabled'
  }),
  { status: 503 }
)
```

**Desabilitar Realtime (fallback para polling):**
```typescript
// Comentar subscription
// const subscription = supabase.channel(...).subscribe()

// Adicionar polling
setInterval(async () => {
  const { data } = await supabase.from('event_state').select('*').single()
  setEventState(data)
}, 5000) // A cada 5s
```

---

## 📞 QUANDO PEDIR AJUDA

### Antes de pedir ajuda, colete:

1. **Mensagem de erro exata** (copiar e colar)
2. **Logs relevantes:**
   - Console do navegador (F12)
   - Supabase Edge Function logs
   - Vercel deployment logs
3. **Steps para reproduzir:**
   - O que você fez
   - O que esperava
   - O que aconteceu
4. **Environment:**
   - Development ou Production
   - Browser/versão
   - Data/hora do problema

### Canais de suporte:

- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **Supabase Support:** https://supabase.com/dashboard/support
- **Vercel Support:** https://vercel.com/support
- **Documentation:** [03-DOCS-INDEX.md](./03-DOCS-INDEX.md)

---

**Desenvolvido por:** Claude Code + Andre Buric
**Data:** 2026-02-03
**Status:** ✅ Completo e Testado
**Última Atualização:** 2026-02-03
