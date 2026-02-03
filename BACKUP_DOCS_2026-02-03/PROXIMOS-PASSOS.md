# 🚀 PRÓXIMOS PASSOS - Sistema de Áudio Personalizado

**Data:** 2026-02-01 23:50
**Status Atual:** ✅ Backend completo | 🟡 GHL 50% configurado | ⏳ Template WhatsApp pendente

---

## 📊 PROGRESSO ATUAL

```
✅ Database (Supabase)           100% ████████████████████
✅ Edge Function                 100% ████████████████████
✅ Integração OpenAI o1-mini     100% ████████████████████
✅ Integração ElevenLabs         100% ████████████████████
✅ Upload Storage                100% ████████████████████
✅ Testes de Conectividade       100% ████████████████████
✅ Webhook App → GHL             100% ████████████████████
🟡 GHL Custom Fields             100% ████████████████████
🟡 GHL Workflow 2 (Gerar Áudio)  100% ████████████████████
⏳ GHL Workflow 1 (Boas-Vindas)    0% ░░░░░░░░░░░░░░░░░░░░
⏳ Template WhatsApp (Meta)        0% ░░░░░░░░░░░░░░░░░░░░
⏳ Teste End-to-End                0% ░░░░░░░░░░░░░░░░░░░░

Progresso Total: 80% ████████████████░░░░
```

---

## 🎯 O QUE VOCÊ PRECISA FAZER AGORA

### ⚠️ IMPORTANTE: Correção de Entendimento

**Você pensou:**
> "Ao preencher a pesquisa, dispara ElevenLabs em paralelo ao GHL, com wait de 15 minutos..."

**Realidade:**
- App → GHL Webhook → Supabase Edge Function
- Edge Function faz TUDO sequencialmente: OpenAI → ElevenLabs → Storage
- **Demora ~30-45 segundos** (não 15 minutos!)
- Retorna `audio_url` pronto

**No GHL:** Configurar timeout da HTTP Request em **60 segundos** (ou 90s com margem).

---

### 1️⃣ Criar e Aprovar Template WhatsApp no Meta (1-2 dias) 🔴 CRÍTICO

**Por que precisa de template?**
- WhatsApp Business API **NÃO permite áudio em templates**
- Solução: Template pede "ok" → abre session window → envia áudio como free-form

**Acesse:** Facebook Business Manager → WhatsApp → Message Templates

**Configuração:**
- **Template Name:** `boas_vindas_diagnostico`
- **Category:** Utility
- **Language:** Portuguese (BR)
- **Body:**
  ```
  Olá! Bem-vindo à Imersão Diagnóstico de Vendas.

  Para ativar suas análises personalizadas, responda: ok
  ```

**Aguardar aprovação:** 24-48 horas

---

### 2️⃣ Configurar Workflow 1 no GHL (30 min)

**Guia completo:** Ver [`FLUXO_AUDIO_BOASVINDAS.md`](./FLUXO_AUDIO_BOASVINDAS.md) seção "Workflow 1"

**Resumo:**

1. **Trigger:** Compra Hotmart (webhook ou tag "comprador-diagnostico-vendas")

2. **Send WhatsApp Template:**
   - Template: `boas_vindas_diagnostico` (o que você criou no Meta)

3. **Wait for Reply:**
   - Aguardar mensagem contendo: "ok"
   - Timeout: 48 horas

4. **Send WhatsApp Message (Audio):**
   - **Condition:** Se `{{contact.audio_imdiagnvendas_url}}` não está vazio
   - **Type:** Audio (NÃO Document!)
   - **URL:** `{{contact.audio_imdiagnvendas_url}}`
   - **Message:**
     ```
     Olá {{contact.first_name}}!

     Aqui está sua análise personalizada. Ouça com atenção:
     ```

5. **Fallback (se áudio ainda não está pronto):**
   - **Wait Condition:** Aguardar até `audio_imdiagnvendas_url` ser preenchido
   - Timeout: 2 horas
   - Se timeout: Enviar mensagem pedindo para completar survey

---

### 3️⃣ Testar Fluxo Completo (1 hora)

**Checklist:**

---

### 3️⃣ Testar Fluxo Completo (1 hora)

**Cenário 1: Fluxo Normal (User Responde "ok" DEPOIS do Survey)**

1. **Compra simulada:**
   - [ ] Webhook Hotmart dispara
   - [ ] Workflow 1 inicia
   - [ ] Template "boas-vindas" chega no WhatsApp
   - [ ] User responde "ok"
   - [ ] Session window abre (verificar no GHL)

2. **Preencher survey:**
   - [ ] Acessar `/obrigado?transaction=HP...`
   - [ ] Completar 8 questões
   - [ ] App chama webhook GHL (ver logs)
   - [ ] Workflow 2 inicia

3. **Validar geração de áudio:**
   - [ ] HTTP Request completa em ~30-60s
   - [ ] Custom field `audio_imdiagnvendas_url` preenchido
   - [ ] Verificar URL acessível no navegador
   - [ ] Áudio reproduz corretamente (voz André)

4. **Validar envio WhatsApp:**
   - [ ] Áudio chega no WhatsApp
   - [ ] Aparece como **voice message** (bolha azul/verde)
   - [ ] Script menciona nome e respostas específicas
   - [ ] Tom natural (emotion tags funcionando)

---

**Cenário 2: User Responde "ok" ANTES do Survey** 🔍

1. User responde "ok" imediatamente após compra
2. Session window abre
3. Workflow 1 tenta enviar áudio → `audio_imdiagnvendas_url` está vazio
4. **Wait Condition:** Aguarda até campo ser preenchido (max 2h)
5. 20 minutos depois: User completa survey
6. Workflow 2 gera áudio e preenche campo
7. Workflow 1 detecta mudança e envia áudio

**Teste:** ✅ Áudio deve chegar assim que for gerado

---

**Cenário 3: User Nunca Responde "ok"** ⚠️

1. User compra mas ignora template
2. User preenche survey
3. Workflow 2 gera áudio e salva no campo
4. Session window nunca abre
5. **Workflow 1:** Após 24h, envia lembrete
6. Se ainda não responder: Workflow envia email com áudio

**Teste:** ✅ Lembrete deve ser enviado após 24h

---

### 4️⃣ Teste Rápido via API (Avançado - 10 min)

Se quiser testar APENAS a geração do áudio (sem GHL):

```bash
./test-generate-audio.sh "email-com-survey@exemplo.com"
```

**Verificar no banco:**
```sql
SELECT
  email,
  status,
  audio_url,
  LEFT(script_generated, 100) as script_preview,
  created_at
FROM survey_audio_files
WHERE email = 'email-com-survey@exemplo.com';
```

---

### 5️⃣ Monitorar Logs (10 min)

**Verificar logs da Edge Function:**
https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/logs/edge-functions

**O que procurar:**
- ✅ Request recebido do GHL? (veja payload completo)
- ✅ Survey encontrado? (se não: user ainda não completou pesquisa)
- ✅ OpenAI gerou script? (tempo: ~15-20s)
- ✅ ElevenLabs converteu? (tempo: ~10-15s, emotion tags incluídas)
- ✅ Upload para Storage? (URL retornada)
- ❌ Algum erro? (copiar stack trace)

**Logs do GHL Workflow:**
- GHL Dashboard → Workflows → Workflow 2 → Activity
- Verificar:
  - HTTP Request Status: 200 OK
  - Response: `success: true`
  - Custom fields atualizados

---

### 6️⃣ Configurar Alertas (Opcional - 20 min)

**Alertas importantes:**

1. **Taxa de erro > 5%**
   - Ação: Verificar API keys e quotas

2. **Tempo de processamento > 60s**
   - Ação: Verificar se APIs estão lentas

3. **Áudio não enviado no WhatsApp**
   - Ação: Verificar workflow GHL

**Ferramentas:**
- Supabase Logs (Edge Function)
- Dashboard OpenAI (uso de tokens)
- Dashboard ElevenLabs (uso de chars)
- GHL Analytics (workflow success rate)

---

## 📋 CHECKLIST COMPLETO

### ✅ Backend - COMPLETO (100%)
- [x] SQL migration executada
- [x] Tabela `survey_audio_files` criada
- [x] Storage bucket `survey-audios` criado
- [x] Edge Function deployada (`generate-audio`)
- [x] Secrets configuradas (OpenAI + ElevenLabs)
- [x] Teste de conectividade OK (curl testado)
- [x] Documentação completa ([FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md))
- [x] Webhook app → GHL implementado (ThankYou.tsx)

### 🟡 GHL - 50% COMPLETO
- [x] Custom Fields criados
  - [x] `audio_imdiagnvendas_url`
  - [x] `imdiagnosticovendas_audio_script`
- [x] Workflow 2 (Gerar Áudio) configurado
  - [x] Trigger: Inbound Webhook
  - [x] HTTP POST → Edge Function
  - [x] Update Contact (salvar audio_url)
- [ ] **TODO: Workflow 1 (Boas-Vindas + "ok")**
  - [ ] Criar trigger: Compra Hotmart
  - [ ] Enviar template WhatsApp (aguardando aprovação Meta)
  - [ ] Wait for Reply ("ok")
  - [ ] Send Audio (free-form message)
- [ ] **TODO: Teste end-to-end completo**

### ⏳ Meta WhatsApp - PENDENTE
- [ ] **CRÍTICO: Criar template "boas_vindas_diagnostico"**
- [ ] Aguardar aprovação (24-48h)
- [ ] Configurar template no Workflow 1

### 🔜 Produção - DEPOIS DOS TESTES
- [ ] Workflow 1 ativado para todas as compras
- [ ] Alertas de erro configurados (Slack/Email)
- [ ] Dashboard de métricas (taxa de sucesso, tempo médio)
- [ ] Documentação interna para equipe (se houver)

---

## 🎓 RECURSOS ÚTEIS

### Documentação
- 📖 [IMPLEMENTACAO-AUDIO-RESUMO.md](./IMPLEMENTACAO-AUDIO-RESUMO.md) - Overview completo
- 🏗️ [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md) - Arquitetura detalhada
- 🛠️ [GUIA-SETUP-GHL-AUDIO.md](./GUIA-SETUP-GHL-AUDIO.md) - Setup GHL passo-a-passo

### Endpoints
- **Edge Function:** https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio
- **Supabase Dashboard:** https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx
- **Storage Browser:** https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/storage/buckets/survey-audios

### Scripts
- `./test-generate-audio.sh <email>` - Testar Edge Function
- Ver logs: Supabase Dashboard → Edge Functions → generate-audio

---

## 💡 DICAS

### Para Testar Rápido
1. Use um email seu para teste
2. Preencha a pesquisa manualmente no app
3. Chame a Edge Function via curl/Postman
4. Baixe o áudio do Storage e ouça

### Para Debug
1. Sempre verificar logs da Edge Function primeiro
2. Verificar se survey existe no banco
3. Verificar quotas OpenAI/ElevenLabs
4. Testar cada step individualmente (OpenAI → ElevenLabs → Storage)

### Para Otimizar
1. Ajustar prompt se scripts muito longos/curtos
2. Ajustar voice settings se voz não ficou natural
3. Considerar cachear scripts similares (futuro)

---

## 🚨 SE ALGO DER ERRADO

### Erro: "Survey não encontrado"
**Causa:** Usuário não preencheu pesquisa ou email incorreto
**Solução:** Verificar banco de dados:
```sql
SELECT * FROM survey_responses WHERE email = 'email@exemplo.com';
```

### Erro: "OpenAI API error"
**Causa:** API key inválida, quota excedida, ou rate limit
**Solução:**
1. Verificar dashboard OpenAI: https://platform.openai.com/usage
2. Testar API key manualmente
3. Verificar créditos disponíveis

### Erro: "ElevenLabs API error"
**Causa:** API key inválida, quota excedida (500K chars/mês no Professional)
**Solução:**
1. Verificar dashboard ElevenLabs: https://elevenlabs.io/app/usage
2. Voice ID correto? `K0Yk2ESZ2dsYv9RrtThg`
3. Upgrade para plan maior se necessário

### Erro: "Storage error"
**Causa:** Bucket não existe ou RLS bloqueando
**Solução:**
1. Verificar bucket existe: Dashboard → Storage → survey-audios
2. Verificar policies (deve permitir upload autenticado)

---

## 📞 SUPORTE

**Dúvidas sobre:**
- **Supabase:** https://supabase.com/docs
- **OpenAI:** https://platform.openai.com/docs
- **ElevenLabs:** https://elevenlabs.io/docs
- **GHL:** https://help.gohighlevel.com/

**Logs e Debugging:**
- Supabase Logs: Dashboard → Logs → Edge Functions
- OpenAI Usage: https://platform.openai.com/usage
- ElevenLabs Usage: https://elevenlabs.io/app/usage

---

## 🎉 QUANDO TUDO ESTIVER FUNCIONANDO

**Você verá:**
1. ✅ Usuário compra no Hotmart
2. ✅ Usuário acessa `/obrigado` e preenche pesquisa
3. ✅ 30 minutos depois: GHL chama Edge Function
4. ✅ Áudio gerado em ~45 segundos
5. ✅ WhatsApp enviado com áudio personalizado
6. ✅ Usuário ouve análise com voz do André
7. ✅ Custom fields salvos no GHL
8. ✅ Registro no banco de dados

**Taxa de sucesso esperada:** > 95%

---

## 📅 TIMELINE SUGERIDO

| Quando | Tarefa | Tempo | Status |
|--------|--------|-------|--------|
| **✅ JÁ FEITO** | Backend completo (Supabase) | ~3h | ✅ Done |
| **✅ JÁ FEITO** | GHL Workflow 2 configurado | 1h | ✅ Done |
| **✅ JÁ FEITO** | Webhook app → GHL | 30min | ✅ Done |
| **🔴 HOJE/AMANHÃ** | Criar template WhatsApp no Meta | 10min + 24-48h aprovação | ⏳ |
| **🟡 APÓS TEMPLATE** | Configurar GHL Workflow 1 | 30min | ⏳ |
| **🟡 APÓS WORKFLOW 1** | Testar fluxo completo (3 cenários) | 1h | ⏳ |
| **🟢 ANTES DO EVENTO** | Validar com 5-10 primeiros compradores | 2-3 dias | ⏳ |
| **🟢 DURANTE EVENTO** | Monitorar taxa de sucesso | - | ⏳ |
| **🟢 PÓS-EVENTO** | Analisar métricas e otimizar | 1h | ⏳ |

**CRÍTICO:** Template WhatsApp precisa ser aprovado pelo Meta 24-48h ANTES do evento!

---

**Boa sorte! 🚀**

Qualquer dúvida, consulte a documentação ou os logs do Supabase.

---

---

## 🎯 RESUMO EXECUTIVO

### ✅ O QUE JÁ ESTÁ FUNCIONANDO (80%)

1. **Supabase Edge Function** - ✅ Deployada e testada
   - Recebe email/transaction_id
   - Gera script via OpenAI o1-mini (~15-20s)
   - Converte para áudio via ElevenLabs eleven_turbo_v3 (~10-15s)
   - Upload para Storage (~5s)
   - Retorna audio_url em ~30-45 segundos

2. **GHL Workflow 2** - ✅ Configurado
   - Trigger: Webhook do app (survey_completed)
   - HTTP POST → Edge Function
   - Salva audio_url no custom field
   - Pronto para enviar áudio

3. **App Integration** - ✅ Implementado
   - ThankYou.tsx chama webhook GHL após survey
   - Payload correto enviado

### ⏳ O QUE FALTA FAZER (20%)

1. **Template WhatsApp** - 🔴 CRÍTICO (bloqueante)
   - Criar no Meta: "Responda ok para ativar"
   - Aguardar aprovação (24-48h)

2. **GHL Workflow 1** - 🟡 IMPORTANTE
   - Configurar trigger de compra
   - Enviar template
   - Aguardar "ok"
   - Enviar áudio

3. **Testes E2E** - 🟡 IMPORTANTE
   - Testar 3 cenários (normal, ok antes survey, nunca ok)
   - Validar áudio chega como voice message
   - Validar script personalizado

### 🚦 PRÓXIMA AÇÃO

**IMEDIATO:** Criar e submeter template WhatsApp no Facebook Business Manager

**Acesse:** https://business.facebook.com/wa/manage/message-templates/

**Template:**
```
Nome: boas_vindas_diagnostico
Categoria: Utility
Idioma: Portuguese (BR)
Body: "Olá! Bem-vindo à Imersão Diagnóstico de Vendas.

Para ativar suas análises personalizadas, responda: ok"
```

---

**Última atualização:** 2026-02-01 23:55 BRT
**Desenvolvido por:** Claude Code + Andre Buric
**Documentação completa:** [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md)
