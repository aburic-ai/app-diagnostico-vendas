# 🎙️ GUIA DE SETUP - Go High Level + Áudio Personalizado

**Data:** 2026-02-01
**Edge Function:** `generate-audio`
**Objetivo:** Enviar áudio personalizado via WhatsApp 30 minutos após compra

---

## 📋 PRÉ-REQUISITOS

✅ Edge Function deployada no Supabase
✅ Secrets configuradas (OpenAI, ElevenLabs)
✅ WhatsApp conectado no GHL
✅ Webhook Hotmart apontando para o GHL

---

## 🔧 PASSO 1: Criar Custom Fields no GHL (5 min)

1. **Acesse:** GHL Dashboard → Settings → Custom Fields
2. **Criar Campo 1:**
   - **Label:** `audio_url`
   - **Type:** Text
   - **Description:** URL do áudio personalizado gerado
   - **Placeholder:** https://supabase.co/storage/...

3. **Criar Campo 2:**
   - **Label:** `audio_script`
   - **Type:** Long Text
   - **Description:** Script do áudio gerado pela IA
   - **Placeholder:** (deixar vazio)

4. **Salvar os campos**

---

## 🔧 PASSO 2: Criar Workflow no GHL (15 min)

### 2.1 Criar Novo Workflow

1. **Acesse:** GHL → Automation → Workflows
2. **Clique em:** "Create Workflow"
3. **Nome:** "Áudio Personalizado - Pós-Compra"
4. **Trigger:** "Webhook" ou "Contact Tag Added" (depende da sua integração Hotmart)

### 2.2 Configurar Trigger

**Opção A - Webhook Hotmart:**
- Trigger Type: Webhook
- Event: `purchase_complete`
- Filter: Product ID = ID do seu produto no Hotmart

**Opção B - Tag:**
- Trigger Type: Contact Tag Added
- Tag: "comprador-diagnostico-vendas"

### 2.3 Adicionar Delay (IMPORTANTE!)

1. **Adicionar Step:** Wait/Delay
2. **Duração:** 30 minutos
3. **Motivo:** Dar tempo para o usuário completar a pesquisa de calibragem

### 2.4 Adicionar HTTP Request (Chamar Edge Function)

1. **Adicionar Step:** Webhook/HTTP Request
2. **Configuração:**

```
Method: POST
URL: https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio

Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4

Body (JSON):
{
  "email": "{{contact.email}}",
  "transaction_id": "{{contact.transaction_id}}",
  "ghl_contact_id": "{{contact.id}}"
}
```

3. **Response Handling:**
   - **Success Path:** Status = 200
   - **Error Path:** Status ≠ 200

### 2.5 Salvar Resposta em Custom Fields

**Adicionar Step:** Update Contact

1. **Custom Field:** `audio_url`
   - Value: `{{webhook_response.audio_url}}`

2. **Custom Field:** `audio_script`
   - Value: `{{webhook_response.script}}`

### 2.6 Enviar Mensagem WhatsApp com Áudio

**Adicionar Step:** Send Message (WhatsApp)

1. **Template da Mensagem:**

```
Olá {{contact.first_name}}! 👋

Recebi suas respostas do Protocolo de Iniciação e gravei uma análise personalizada pra você.

Dá uma ouvida com atenção:
```

2. **Attachment:**
   - Type: Audio
   - URL: `{{contact.custom_fields.audio_url}}`

3. **Fallback (se áudio falhar):**
   - Enviar o script em texto: `{{contact.custom_fields.audio_script}}`

### 2.7 Error Handling (Opcional)

**Adicionar Step:** If/Else

- **Condição:** `{{webhook_response.success}}` = true
- **Se SIM:** Enviar WhatsApp com áudio
- **Se NÃO:** Notificar admin + enviar mensagem genérica

---

## 🧪 PASSO 3: Testar o Workflow (10 min)

### 3.1 Teste Manual

1. **No GHL, clique em "Test Workflow"**
2. **Selecione um contato de teste** (com email real)
3. **Execute o workflow manualmente**
4. **Aguarde ~30-45 segundos** (processamento do áudio)
5. **Verifique:**
   - ✅ Custom fields `audio_url` e `audio_script` preenchidos?
   - ✅ Mensagem WhatsApp enviada?
   - ✅ Áudio reproduz corretamente no WhatsApp?

### 3.2 Verificar Logs da Edge Function

1. **Acesse:** https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/logs/edge-functions
2. **Selecione:** `generate-audio`
3. **Verifique logs:**
   - ✅ Request recebido?
   - ✅ Survey encontrado?
   - ✅ OpenAI gerou script?
   - ✅ ElevenLabs converteu para áudio?
   - ✅ Upload para Storage?

### 3.3 Verificar Banco de Dados

**SQL Query no Supabase:**

```sql
-- Ver áudios gerados
SELECT
  email,
  status,
  audio_url,
  LEFT(script_generated, 100) AS script_preview,
  created_at,
  completed_at
FROM survey_audio_files
ORDER BY created_at DESC
LIMIT 10;

-- Ver áudios no storage
SELECT
  name,
  created_at,
  metadata->>'size' AS size_bytes
FROM storage.objects
WHERE bucket_id = 'survey-audios'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 MONITORAMENTO

### Métricas Importantes

| Métrica | Como Verificar | Objetivo |
|---------|----------------|----------|
| Taxa de Sucesso | Supabase Logs | > 95% |
| Tempo de Processamento | Edge Function Logs | < 45s |
| Áudios Gerados | `SELECT COUNT(*) FROM survey_audio_files WHERE status='completed'` | 100% dos surveys |
| Erros OpenAI | Logs: "OpenAI falhou" | < 1% |
| Erros ElevenLabs | Logs: "ElevenLabs falhou" | < 1% |

### Alertas Recomendados

1. **Taxa de erro > 5%:** Verificar API keys
2. **Tempo > 60s:** Verificar quotas OpenAI/ElevenLabs
3. **Áudio não enviado:** Verificar GHL WhatsApp conectado

---

## 💰 CUSTOS ESTIMADOS

| Item | Custo por Áudio | 1000 Usuários |
|------|-----------------|---------------|
| OpenAI o1-mini | $0.01 | $10 |
| ElevenLabs TTS | $0.18 | $180 |
| Supabase Storage | $0.00 | $0 (free tier) |
| **TOTAL** | **$0.19** | **$190** |

**Nota:** Verificar quotas dos planos:
- ElevenLabs Professional: 500K chars/mês (~833 áudios)
- Para 1000 usuários, precisará do plano Enterprise

---

## 🐛 TROUBLESHOOTING

### Problema: Áudio não é gerado

**Possíveis causas:**
1. Survey não existe no banco (usuário não completou pesquisa)
2. API keys incorretas
3. Quotas excedidas (OpenAI ou ElevenLabs)

**Solução:**
- Verificar logs da Edge Function
- Testar manualmente com curl (ver `test-generate-audio.sh`)
- Verificar dashboard OpenAI/ElevenLabs para quotas

### Problema: Áudio não chega no WhatsApp

**Possíveis causas:**
1. URL do áudio não salva no custom field
2. WhatsApp desconectado no GHL
3. Template de mensagem incorreto

**Solução:**
- Verificar custom field `audio_url` está preenchido
- Testar envio manual de áudio no GHL
- Verificar logs do workflow no GHL

### Problema: Áudio muito longo ou muito curto

**Possíveis causas:**
1. Prompt gerando scripts fora do padrão (< 400 ou > 800 chars)

**Solução:**
- Verificar campo `script_generated` no banco
- Ajustar prompt em `prompts/audio-script.ts`
- Re-deploy da Edge Function

---

## 📝 CHECKLIST FINAL

Antes de ir para produção:

- [ ] Workflow GHL testado com contato real
- [ ] Áudio recebido no WhatsApp e reproduz corretamente
- [ ] Custom fields salvando dados
- [ ] Logs da Edge Function sem erros
- [ ] Banco de dados registrando áudios
- [ ] Fallback testado (se OpenAI falhar)
- [ ] Monitoramento configurado
- [ ] Quotas das APIs verificadas (OpenAI + ElevenLabs)

---

## 🚀 DEPLOY CHECKLIST

- [x] Migration SQL executada
- [x] Edge Function deployada
- [x] Secrets configuradas
- [x] Teste de conectividade OK
- [ ] GHL Custom Fields criados
- [ ] GHL Workflow configurado
- [ ] Teste end-to-end completo
- [ ] Monitoramento ativo

---

**Última atualização:** 2026-02-01
**Status:** Pronto para configuração GHL
**Endpoint:** https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio
