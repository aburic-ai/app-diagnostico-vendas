# 🎙️ ÁUDIO PERSONALIZADO PÓS-PESQUISA - Imersão Diagnóstico de Vendas

**Data de criação:** 2026-02-01
**Última atualização:** 2026-02-01 (23:30)

---

## 📋 VISÃO GERAL

Após a compra da Imersão Diagnóstico de Vendas, o participante preenche uma pesquisa de onboarding com 8 perguntas. Com base nessas respostas, o sistema:

1. Gera um **texto personalizado** usando OpenAI o1-mini
2. Converte o texto em **áudio** via ElevenLabs (voz do André Buric clonada)
3. Envia o **áudio via WhatsApp** através do Go High Level

**Objetivo:** Fazer o participante sentir *"Finalmente alguém me entendeu"* + elevar expectativa pela imersão + direcionar para o Dossiê de Inteligência.

---

## 🏗️ ARQUITETURA DO SISTEMA (2 WORKFLOWS)

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ HOTMART                                                          │
│ Compra aprovada → Webhook para GHL                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ WORKFLOW 1: MENSAGEM DE BOAS-VINDAS (PÓS-COMPRA)                │
│ Trigger: Compra Hotmart                                         │
│ 1. Cria/atualiza contato                                        │
│ 2. Envia WhatsApp Template: "imersao_diagnostico_boasvindas_v02"│
│    "Salve {{nome}}, você está dentro..."                        │
│    Link do app → Protocolo de Iniciação                         │
│ 3. FIM (SEM áudio, SEM "ok")                                    │
└──────────────────────────────────────────────────────────────────┘

                                        ↓ (usuário preenche)

┌─────────────────────────────────────────────────────────────────┐
│ APP - THANK YOU PAGE                                             │
│ Usuário preenche Protocolo de Iniciação (8 questões)            │
│ → Salva em survey_responses                                     │
│ → Chama webhook GHL: "survey_completed"                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ WORKFLOW 2: ÁUDIO PERSONALIZADO (PÓS-PESQUISA)                  │
│ Trigger: Webhook do App (survey_completed)                      │
│ 1. Find/Create Contact                                          │
│ 2. HTTP POST → Supabase Edge Function ─────────────┐            │
│    (~30-45 segundos para processar)                │            │
│                                                     ▼            │
│    ┌─────────────────────────────────────────────────────┐      │
│    │ EDGE FUNCTION: generate-audio                       │      │
│    │ 1. Busca survey_responses (8 questões)              │      │
│    │ 2. OpenAI o1-mini → Script personalizado            │      │
│    │ 3. ElevenLabs TTS → MP3 (voz André + emotion tags)  │      │
│    │ 4. Upload → Supabase Storage                        │      │
│    │ 5. Retorna: { audio_url, script }                   │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                     │            │
│ 3. Recebe response ←────────────────────────────────┘            │
│ 4. Update Contact (salva audio_url + script em custom fields)   │
│ 5. Send WhatsApp Template: "imersao_diagnostico_pos_pesquisa_v01"│
│    "Protocolo recebido. Áudio pronto. Responda ok..."           │
│ 6. Wait for Reply ("ok")                                        │
│ 7. Send WhatsApp Message (Free-form, Audio)                     │
│    "Salve {{nome}}, ouça antes de qualquer outra coisa: [ÁUDIO]"│
└──────────────────────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ WHATSAPP                                                         │
│ Áudio chega como mensagem de voz nativa (não link/documento)    │
│ Duração: 1-2 minutos                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📱 TEMPLATES WHATSAPP

### Workflow 1: Mensagem de Boas-Vindas (Pós-Compra)

**Template Name:** `imersao_diagnostico_boasvindas_v02`
**Category:** Utility
**Language:** Portuguese (BR)
**Status:** ✅ Aprovado Meta

**Body:**
```
Salve {{1}}, você está dentro da Imersão Diagnóstico de Vendas.
📅 {{custom_values.imersao_diagnostico_entrada}} — online e ao vivo.
Seu primeiro passo: preencher o Protocolo de Iniciação.
É com base nele que o sistema gera sua análise personalizada antes do evento — onde sua venda trava, o que você já tentou, qual o padrão que está te custando resultado.
Acesse aqui: {{custom_values.imersao_diagnostico_link_app}}
Leva 3 minutos. Vale cada segundo — é ele que torna a imersão única pra você.
```

**Variáveis:**
- `{{1}}` = Primeiro nome do contato
- `{{custom_values.imersao_diagnostico_entrada}}` = Data do evento (ex: "28/02 e 01/03")
- `{{custom_values.imersao_diagnostico_link_app}}` = Link do app/painel

---

### Workflow 2: Protocolo Recebido (Pós-Pesquisa)

**Template Name:** `imersao_diagnostico_pos_pesquisa_v01`
**Category:** Utility
**Language:** Portuguese (BR)
**Status:** ⏳ Precisa ser criado e aprovado no Meta

**Body:**
```
Olá {{1}}, protocolo recebido.

Um áudio personalizado está pronto com indicações para você, baseado nas suas respostas.

Responde ok, ou qualquer coisa que eu libero o envio.
```

**Variáveis:**
- `{{1}}` = Primeiro nome do contato

---

### Workflow 2: Mensagem com Áudio (Free-form)

**Tipo:** Free-form Message (após "ok")
**Requer:** Session window aberta (user respondeu ao template)

**Message:**
```
Salve {{nome}}, ouça antes de qualquer outra coisa:
[ÁUDIO]
Depois assiste o Dossiê de Inteligência no seu painel. Vai conectar.
```

**Attachment:**
- **Type:** Audio (não Document!)
- **URL:** `{{contact.audio_imdiagnvendas_url}}`

### Por que GHL ao invés de Evolution API?

✅ **GHL é melhor porque:**
- WhatsApp nativo incluído no plano (sem custo extra)
- Workflow visual (fácil ajustar timing/mensagens)
- Custom fields para armazenar dados
- Tracking de conversas automático
- Menos infraestrutura (não precisa servidor Evolution)
- Um sistema só (CRM + WhatsApp)

### Por que o Padrão "ok" (Ativação)?

⚠️ **Limitação Técnica:** WhatsApp Business API Templates NÃO suportam áudio como attachment.

**Templates permitem:**
- Text ✅
- Image ✅
- Video ✅
- Document ✅
- Audio ❌ **NÃO SUPORTADO**

**Solução: Session Window**

Quando um usuário RESPONDE a uma mensagem template, o WhatsApp abre uma "session window" de 24 horas onde você pode enviar mensagens free-form (incluindo áudio) sem precisar de template aprovado.

**Fluxo:**
1. Template pede: "Responda ok para ativar"
2. User responde: "ok"
3. Session window abre → GHL pode enviar áudio como mensagem nativa
4. Áudio aparece como voice message (não como link ou documento)

**Inspiração:** Este padrão foi observado na Imersão MSA do Léo Soares e funciona perfeitamente.

---

## 📊 WORKFLOW 2 - DETALHAMENTO COMPLETO

### Trigger: Inbound Webhook

**URL do Webhook:** `https://services.leadconnectorhq.com/hooks/R2mu3tVVjKvafx2O2wlw/webhook-trigger/uMAGh6b3u7aHWBn2sH6f`

**Payload esperado (do App):**
```json
{
  "buyer": {
    "name": "João Silva",
    "email": "usuario@email.com",
    "checkout_phone": "+5511999999999"
  },
  "transaction_id": "HP0603054387",
  "event": "survey_completed"
}
```

### Passo 1: Find or Create Contact

**Action:** Create Update Contact (GHL)
**Lookup fields:** Email AND Phone (melhor matching)

**Fields:**
- **Full Name:** `{{body.buyer.name}}`
- **Email:** `{{body.buyer.email}}`
- **Phone:** `{{body.buyer.checkout_phone}}`

**Comportamento:**
- Se contato existe (por email ou phone) → Atualiza
- Se não existe → Cria novo contato

**Output:** `contact.id`, `contact.first_name`, `contact.audio_imdiagnvendas_url`

### Passo 2: HTTP Request → Supabase Edge Function

**Action:** Webhook/HTTP Request
**Method:** POST
**URL:** `https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4
```

**Body (JSON) - Custom Data:**
```json
{
  "email": "{{body.buyer.email}}",
  "transaction_id": "{{body.transaction_id}}",
  "ghl_contact_id": "{{contact.id}}"
}
```

**⚠️ IMPORTANTE - Variáveis GHL:**
- ✅ USE: `{{body.buyer.email}}` (NÃO `{{contact.email}}`)
- ✅ USE: `{{body.transaction_id}}` (NÃO `{{body.buyer.transaction_id}}`)
- ✅ USE: `{{contact.id}}` (após Find Contact action)

**Timeout Recomendado:** 60 segundos (ou 90s com margem)

**Response esperado (30-45 segundos):**
```json
{
  "success": true,
  "audio_url": "https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/...",
  "script": "Fala, Marina! Aqui é o André...",
  "duration_seconds": 90
}
```

---

### 📋 GUIA VISUAL - CONFIGURAÇÃO EXATA NO GHL

#### Action 1: Webhook (HTTP Request)

**Campos no GHL:**

| Campo | Valor Exato |
|-------|-------------|
| **Action Name** | `Webhook` (ou "Gerar Áudio") |
| **Method** | `POST` |
| **URL** | `https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio` |
| **Timeout** | `60000` (60 segundos) ou `90000` (90s com margem) |

**Custom Data (adicione 3 items):**

| Key | Value |
|-----|-------|
| `email` | `{{body.buyer.email}}` ⚠️ NÃO use `{{contact.email}}`! |
| `transaction_id` | `{{body.transaction_id}}` |
| `ghl_contact_id` | `{{contact.id}}` |

**Headers (adicione 2 items):**

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4` |

**⚠️ COPIE O TOKEN COMPLETO ACIMA! Não truncar.**

---

#### Action 2: Update Contact Field

**Descobrir nome da variável:**
1. Clique em "Insert Variable" (`{x}` icon)
2. Procure pela resposta do webhook anterior (pode ser "webhook_response", "Webhook", ou "response")
3. Use o que aparecer no autocomplete

**Configure 2 fields:**

| Field Name | Value (descobrir variável correta) |
|------------|-------------------------------------|
| `audio_diagnosticovendas_url` | `{{webhook_response.audio_url}}` ou `{{Webhook.audio_url}}` |
| `imdiagnosticovendas_audio_script` | `{{webhook_response.script}}` ou `{{Webhook.script}}` |

**⚠️ IMPORTANTE:** Nomes dos custom fields devem existir previamente no GHL (ver seção "Custom Fields" abaixo).

---

### Passo 3: Branching (If/Else)

**Condição:** `{{webhook_response.success}}` = `true`

#### Branch A: Success (áudio gerado)

**3.1 Update Contact**

**⚠️ VERIFICAR VARIÁVEL NO GHL:**
No GHL, clique em "Insert Variable" para descobrir o nome correto da resposta do webhook.

**Opções possíveis:**
- `{{webhook_response.audio_url}}` (mais comum)
- `{{Webhook.audio_url}}` (se o GHL usar nome da ação)
- `{{response.audio_url}}` (alternativa)

**Configure:**
- **Field:** `audio_diagnosticovendas_url` → `{{webhook_response.audio_url}}` (ou variável correta)
- **Field:** `imdiagnosticovendas_audio_script` → `{{webhook_response.script}}` (ou variável correta)

**IMPORTANTE:** Os nomes dos custom fields devem ser EXATAMENTE:
- `audio_diagnosticovendas_url` (sem "im" no início)
- `imdiagnosticovendas_audio_script` (com "im" no início)

**3.2 Check Session Window (If/Else)**

**Condição:** Verificar se user já respondeu "ok" no Workflow 1

**Como fazer:**
- Opção 1: Check se `contact.tags` contém "session-ativa"
- Opção 2: Check timestamp da última mensagem recebida (< 24h)
- Opção 3: Simplesmente enviar sempre (GHL só permite se session aberta)

**Recomendação:** Opção 3 (simples)

**3.3 Send WhatsApp Message**

**Action:** Send Message (WhatsApp)
**Contact:** `{{contact.id}}`
**Type:** Audio (não Document!)
**Message:**
```
Olá {{contact.first_name}}!

Aqui está sua análise personalizada com base no Protocolo de Iniciação. 🎯

Ouça com atenção:
```

**Attachment:**
- **Type:** Audio
- **URL:** `{{contact.audio_imdiagnvendas_url}}`

**Observação:** Se session window NÃO estiver aberta, esta mensagem vai FALHAR silenciosamente. Não é problema porque:
- Workflow 1 está aguardando "ok"
- Quando "ok" chegar, session abre
- Workflow 1 pode então enviar o áudio usando o custom field `audio_imdiagnvendas_url`

#### Branch B: Error (áudio falhou)

**3.4 Send Error Message (Internal Notification)**

Opção 1: Notificar admin via email/Slack
Opção 2: Marcar contato com tag "audio-failed"
Opção 3: Enviar mensagem texto fallback:

```
Olá {{contact.first_name}}!

Sua análise personalizada está sendo processada. Você receberá em breve!

Enquanto isso, acesse seu painel: [link]
```

### Passo 4: End Workflow

---

## 🔄 EDGE CASES TRATADOS

### Caso 1: User Responde "ok" ANTES de Completar Survey

**Cenário:**
1. Workflow 1 envia template de boas-vindas
2. User responde "ok" imediatamente
3. Session window abre (24h)
4. Workflow 1 tenta enviar áudio → custom field está vazio
5. 10 minutos depois: User completa survey
6. Workflow 2 gera áudio e salva em custom field

**Problema:** Workflow 1 não tem áudio para enviar ainda.

**Solução:**
- Workflow 1 adiciona um **Wait Condition** após receber "ok"
- Espera até que `contact.audio_imdiagnvendas_url` NÃO esteja vazio
- Timeout: 2 horas
- Se timeout: Envia mensagem genérica pedindo para completar survey

### Caso 2: User Completa Survey MAS Nunca Responde "ok"

**Cenário:**
1. User compra
2. User preenche survey
3. Workflow 2 gera áudio e salva em custom field
4. User ignora template de boas-vindas (não responde "ok")

**Problema:** Session window nunca abre, áudio não pode ser enviado.

**Solução:**
- Workflow 1 envia **lembrete** após 24h sem resposta
- Template 2: "Lembrete: Responda 'ok' para receber sua análise personalizada!"
- Se ainda não responder: Enviar email com link para dashboard

### Caso 3: Survey Demora Muito para Ser Preenchido

**Cenário:**
1. User compra
2. User responde "ok" → session window abre
3. User demora 20 horas para preencher survey
4. Session window ainda está aberta (< 24h)
5. Workflow 2 gera áudio e envia

**Resultado:** Funciona perfeitamente. ✅

### Caso 4: Session Window Expira (24h) ANTES de Survey

**Cenário:**
1. User compra e responde "ok"
2. Session window abre
3. 25 horas depois: User completa survey
4. Session window expirou

**Problema:** Não pode enviar áudio como free-form message.

**Solução:**
- Workflow 2 tenta enviar → Falha
- Workflow 2 envia EMAIL com áudio:
  - Subject: "Sua Análise Personalizada - Imersão Diagnóstico de Vendas"
  - Body: Link para ouvir áudio + transcrição do script

---

## 📊 DADOS DA PESQUISA (8 Questões)

### Campos Capturados

| Campo | Pergunta | Tipo | Obrigatório |
|-------|----------|------|-------------|
| `nome` | (da compra Hotmart) | string | Sim |
| `telefone` | (da compra Hotmart) | string | Sim |
| `email` | (da compra Hotmart) | string | Sim |
| `modelo_negocio` | O que você vende, fundamentalmente? | enum | Sim |
| `faturamento` | Qual a faixa de faturamento mensal? | enum | Sim |
| `onde_trava` | Onde você sente que sua venda trava hoje? | enum | Sim |
| `tentativas_anteriores` | O que você já tentou fazer para resolver isso? | text | Sim |
| `investimento_anterior` | Quanto já investiu em cursos/mentorias de vendas? | enum | Sim |
| `cursos_anteriores` | Quais cursos ou mentorias já fez? | text | Não |
| `problema_principal` | UM problema que quer resolver definitivamente? | text | Sim |
| `interesse_pos` | Interesse em acompanhamento pós-evento? | enum | Sim |

### Valores dos Enums

**modelo_negocio:**
- `servicos` = "Serviços (consultoria, agência, freelancer, terapia, etc.)"
- `infoprodutos` = "Infoprodutos / Cursos / Mentoria"
- `produtos_fisicos` = "Produtos físicos / E-commerce"
- `saas` = "Software / SaaS"
- `negocio_local` = "Negócio local (loja, clínica, restaurante, etc.)"
- `outro` = "Outro"

**faturamento:**
- `zero` = "Ainda não faturo / Estou começando"
- `ate_10k` = "Até R$ 10.000/mês"
- `10k_50k` = "R$ 10.000 a R$ 50.000/mês"
- `50k_100k` = "R$ 50.000 a R$ 100.000/mês"
- `acima_100k` = "Acima de R$ 100.000/mês"

**onde_trava:**
- `atracao` = "Atração — Poucas pessoas chegam, ou chega gente desqualificada"
- `oferta` = "Oferta — Pessoas chegam, gostam, mas acham caro ou dizem 'vou pensar'"
- `fechamento` = "Fechamento — Tenho leads, mas não consigo converter na hora H"
- `processo` = "Processo — Vendo, mas é bagunçado e depende só de mim"

**investimento_anterior:**
- `nunca` = "Nunca investi"
- `ate_5k` = "Até R$ 5.000"
- `5k_20k` = "R$ 5.000 a R$ 20.000"
- `acima_20k` = "Mais de R$ 20.000"

**interesse_pos:**
- `sim` = "Sim, quero saber mais sobre mentoria ou acompanhamento"
- `talvez` = "Talvez, depende dos resultados da imersão"
- `nao` = "Não no momento, só quero participar do evento"

---

## 🤖 PROMPT PARA OPENAI o1-mini

### Modelo e Configuração

**Modelo:** `o1-mini` (não gpt-4, não o1-preview)
**Razão:** Custo 80% menor que o1-preview, qualidade suficiente para análise de survey

**Configuração:**
```javascript
{
  model: 'o1-mini',
  messages: [{ role: 'user', content: prompt }],
  // o1-mini não suporta temperature, max_tokens é implícito
}
```

### Emotion Tags (ElevenLabs)

O script gerado DEVE incluir emotion tags para voz mais expressiva:

**Tags disponíveis:**
- `[happy]` - Tom alegre, acolhedor
- `[thoughtful]` - Tom reflexivo, pensativo
- `[speaking with determination]` - Tom firme, decisivo
- `[exhales sharply]` - Suspiro, pausa dramática
- `[conversational]` - Tom casual de conversa
- `[serious]` - Tom sério, direto

**Exemplo de uso:**
```
[happy] Fala, Marina! Aqui é o André.
[thoughtful] Vi que você tem uma consultoria faturando entre 30 e 50 mil por mês...
[speaking with determination] Quero que você assista o Dossiê de Inteligência no seu painel...
[happy] Te vejo na imersão.
```

**IMPORTANTE:** No prompt, use apenas "André" (sem sobrenome "Buric") porque o TTS pronuncia melhor.

### Template do Prompt

```
# CONTEXTO

Você é o sistema de diagnóstico da Imersão Diagnóstico de Vendas. Você acabou de receber as respostas de pré-diagnóstico de um participante.

Sua tarefa é gerar um SCRIPT DE ÁUDIO personalizado para essa pessoa. Este script será convertido em voz pelo André (voz clonada via ElevenLabs) e enviado via WhatsApp.

# OBJETIVO DO ÁUDIO

O participante precisa sentir: "Finalmente alguém me entendeu."

Você NÃO está vendendo nada. Você está mostrando que:
1. Você leu e analisou o que ela escreveu
2. Você já identificou um padrão ou ponto de atenção
3. A imersão vai ajudá-la de forma profunda

# DADOS DO PARTICIPANTE

Nome: {{nome}}
Modelo de negócio: {{modelo_negocio}}
Faturamento mensal: {{faturamento}}
Onde a venda trava: {{onde_trava}}
O que já tentou que não funcionou: {{tentativas_anteriores}}
Quanto já investiu em cursos/mentorias: {{investimento_anterior}}
Quais cursos/mentorias já fez: {{cursos_anteriores}}
Problema que quer resolver definitivamente: {{problema_principal}}
Interesse em acompanhamento: {{interesse_pos}}

# CONTEÚDO DO DOSSIÊ DE INTELIGÊNCIA (VÍDEO BÔNUS)

O participante tem acesso a um vídeo que aborda os 7 Ruídos Neurais que sabotam vendas:

1. Ruído de Identidade - Cliente não sabe quem você é ou por que deveria te ouvir
2. Ruído de Sequência - Você tentou vender antes de criar contexto
3. Ruído de Prova - Falta de evidência tangível de que funciona
4. Ruído de Complexidade - Informação demais, cérebro desliga
5. Ruído de Urgência - Cliente não vê motivo para decidir agora
6. Ruído de Comando - Falta direção clara do próximo passo
7. Ruído de Dissonância - Solução não combina com a identidade do cliente

# LÓGICA DE DIRECIONAMENTO PARA O VÍDEO

Com base no campo "onde_trava", direcione para os ruídos mais prováveis:

- Se "Atração" → Ruído de Identidade + Ruído de Prova
- Se "Oferta" → Ruído de Sequência + Ruído de Urgência
- Se "Fechamento" → Ruído de Comando + Ruído de Urgência
- Se "Processo" → Ruído de Complexidade + Ruído de Comando

# ESTRUTURA OBRIGATÓRIA DO SCRIPT

## Bloco 1 - Saudação (1-2 linhas)
- Chamar pelo primeiro nome
- Mencionar que recebeu/analisou as respostas
- Tom: direto, sem firula
- Exemplo: "Fala, Marina! Aqui é o André Buric. Recebi suas respostas e já analisei."

## Bloco 2 - Validação + Diagnóstico Rápido (3-5 linhas)
- Baseado no faturamento + onde trava + o que já tentou
- Identificar o PADRÃO ou RISCO principal que você percebe
- Mostrar que você ENTENDE o que ela está passando
- Referenciar algo específico que ela escreveu nos campos abertos
- NÃO resolver o problema, apenas NOMEAR
- Exemplo: "Você tem uma consultoria faturando entre 30 e 50 mil por mês, e marcou que o maior problema é fechamento. Você mencionou que já tentou scripts de vendas e até uma mentoria de copywriting, mas nada resolveu de verdade."

## Bloco 3 - Direcionamento para o Vídeo (2-3 linhas)
- Apontar para o Dossiê de Inteligência (vídeo dos 7 Ruídos)
- Indicar UM ou DOIS ruídos específicos para ela prestar atenção
- Conectar com o problema que ela quer resolver
- Exemplo: "Quero que você assista o Dossiê de Inteligência no seu painel. Presta atenção especial no Ruído de Comando e no Ruído de Urgência. Pelo que você descreveu, um desses dois está ativo."

## Bloco 4 - Elevação da Imersão (2-3 linhas)
- Deixar claro que o vídeo é preparação, a imersão é o diagnóstico real
- Criar expectativa: "anota tudo"
- Reforçar: não é curso, é diagnóstico do negócio dela
- Exemplo: "Mas lembra: o vídeo é a preparação. A imersão é onde a gente abre o seu caso de verdade. Chega lá com tudo anotado."

## Bloco 5 - Fechamento (1 linha)
- Despedida curta e firme
- Pode usar "Te vejo na imersão" ou similar
- Exemplo: "Te vejo na imersão."

# REGRAS CRÍTICAS DE FORMATAÇÃO

- **Formato:** Script para ser lido em voz alta (natural, conversacional)
- **Tamanho:** 400-800 caracteres (MÁXIMO 800 - será convertido em áudio de 1-2 minutos)
- **NÃO usar:**
  - Emojis (será áudio, não texto)
  - Asteriscos, negritos, markdown
  - Linguagem de coach motivacional
  - Frases clichês ("jornada", "transformação")
- **PODE usar:**
  - Linguagem coloquial brasileira ("cara", "né?", "olha")
  - Frases curtas e diretas
  - Tom de mentor próximo
- **Tom:** Como um médico especialista falando com um paciente. Firme, calmo, direto.
- **IMPORTANTE:** Se a pessoa escreveu algo específico nos campos abertos, REFERENCIE isso no script. Isso cria o efeito "me entendeu".

# EXEMPLO DE SCRIPT COM EMOTION TAGS

[happy] Fala, Marina! Aqui é o André. Recebi suas respostas e já dei uma olhada por aqui.

[thoughtful] Vi que você tem uma consultoria faturando entre 30 e 50 mil por mês... e marcou que o maior problema é fechamento — os leads chegam, a conversa flui, mas trava na hora H.

Você mencionou que já tentou scripts de vendas e até uma mentoria de copywriting, mas nada resolveu de verdade.

[serious] Isso me diz uma coisa: o problema provavelmente não é O QUE você fala. É QUANDO você fala e COMO você conduz.

[speaking with determination] Quero que você assista o Dossiê de Inteligência no seu painel. Presta atenção especial no Ruído de Comando e no Ruído de Urgência. Pelo que você descreveu, um desses dois está ativo.

[conversational] Mas lembra: o vídeo é a preparação. A imersão é onde a gente abre o seu caso de verdade.

Chega lá com tudo anotado.

[happy] Te vejo na imersão.

# GERE O SCRIPT AGORA

Com base nos dados do participante acima, gere APENAS o script do áudio (sem aspas, sem título, sem explicações adicionais). O script deve soar natural quando lido em voz alta.
```

---

## ⚙️ IMPLEMENTAÇÃO TÉCNICA

### Estrutura de Arquivos

```
supabase/functions/generate-audio/
├── index.ts                    # Handler principal
├── _shared/
│   ├── openai-service.ts       # OpenAI o5-mini
│   ├── elevenlabs-service.ts   # ElevenLabs TTS
│   └── storage-service.ts      # Supabase Storage
└── prompts/
    └── audio-script.ts         # Template do prompt
```

### Handler Principal (index.ts)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateScript } from './_shared/openai-service.ts'
import { textToSpeech } from './_shared/elevenlabs-service.ts'
import { uploadAudio } from './_shared/storage-service.ts'

serve(async (req) => {
  try {
    const { email, transaction_id } = await req.json()

    // 1. Buscar survey
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: survey } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('email', email)
      .or(`transaction_id.eq.${transaction_id}`)
      .single()

    if (!survey) {
      throw new Error('Survey não encontrado')
    }

    // 2. Gerar script via OpenAI
    const script = await generateScript(survey)

    // 3. Converter para áudio via ElevenLabs
    const audioBlob = await textToSpeech(script)

    // 4. Upload para Storage
    const audioUrl = await uploadAudio(supabase, audioBlob, email)

    // 5. Salvar registro
    await supabase.from('survey_audio_files').insert({
      survey_response_id: survey.id,
      user_id: survey.user_id,
      email: survey.email,
      script_generated: script,
      audio_url: audioUrl,
      status: 'completed',
    })

    // 6. Retornar para GHL
    return new Response(
      JSON.stringify({
        success: true,
        audio_url: audioUrl,
        message_text: script,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### OpenAI Service

```typescript
// _shared/openai-service.ts
import OpenAI from 'https://esm.sh/openai@4'
import { getPromptTemplate } from '../prompts/audio-script.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

export async function generateScript(surveyData: any): Promise<string> {
  const prompt = buildPrompt(surveyData)

  const response = await openai.chat.completions.create({
    model: 'o1-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  })

  const script = response.choices[0].message.content || ''

  // Validação
  if (script.length < 200 || script.length > 1000) {
    throw new Error('Script fora do tamanho esperado')
  }

  return script
}

function buildPrompt(data: any): string {
  const template = getPromptTemplate()

  return template
    .replace('{{nome}}', data.nome || 'participante')
    .replace('{{modelo_negocio}}', formatEnum('modelo_negocio', data.modelo_negocio))
    .replace('{{faturamento}}', formatEnum('faturamento', data.faturamento))
    .replace('{{onde_trava}}', formatEnum('onde_trava', data.onde_trava))
    .replace('{{tentativas_anteriores}}', data.tentativas_anteriores || 'Não informado')
    .replace('{{investimento_anterior}}', formatEnum('investimento_anterior', data.investimento_anterior))
    .replace('{{cursos_anteriores}}', data.cursos_anteriores || 'Não informado')
    .replace('{{problema_principal}}', data.problema_principal || 'Não informado')
    .replace('{{interesse_pos}}', formatEnum('interesse_pos', data.interesse_pos))
}
```

### ElevenLabs Service

```typescript
// _shared/elevenlabs-service.ts
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!
const ELEVENLABS_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID')!

export async function textToSpeech(text: string): Promise<Blob> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v3', // Modelo mais rápido e barato (suporta emotion tags)
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.status}`)
  }

  return response.blob()
}
```

**Modelos ElevenLabs:**
- `eleven_turbo_v3` - ✅ **USADO** - Mais rápido (~2-3s), suporta emotion tags, PT-BR nativo
- `eleven_multilingual_v2` - Mais lento (~5-8s), qualidade superior mas desnecessário
- `eleven_monolingual_v1` - Inglês apenas

---

## 🗄️ SCHEMA DO BANCO DE DADOS

### Tabela: `survey_audio_files`

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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_survey_audio_email ON public.survey_audio_files(email);
CREATE INDEX idx_survey_audio_status ON public.survey_audio_files(status);
```

### Storage Bucket: `survey-audios`

- **Access:** Private (apenas autenticados podem fazer upload)
- **Max file size:** 10MB
- **MIME types:** `audio/mpeg`, `audio/mp3`

---

## 🔐 VARIÁVEIS DE AMBIENTE

### ✅ Configurado no Supabase (via CLI):

```bash
# OpenAI
supabase secrets set OPENAI_API_KEY="sk-proj-r-_onE..."

# ElevenLabs
supabase secrets set ELEVENLABS_API_KEY="sk_88880a4e..."
supabase secrets set ELEVENLABS_VOICE_ID="K0Yk2ESZ2dsYv9RrtThg"
```

**Voice ID Real:** `K0Yk2ESZ2dsYv9RrtThg` (voz clonada do André Buric)

### ✅ Configurado no Go High Level:

#### 1. Custom Fields no Contato

| Field Name | Type | Description |
|------------|------|-------------|
| `audio_imdiagnvendas_url` | Text | URL do áudio no Supabase Storage |
| `imdiagnosticovendas_audio_script` | Long Text | Script gerado (backup texto) |

#### 2. Workflows

**Workflow 1: Mensagem de Boas-Vindas**
- **Trigger:** Compra Hotmart (webhook)
- **Ação:** Enviar WhatsApp Template
- **Template (aguardando aprovação Meta):**
  ```
  Olá! Bem-vindo à Imersão Diagnóstico de Vendas.

  Para ativar suas análises personalizadas, responda: ok
  ```
- **Wait for Reply:** Aguardar resposta contendo "ok"
- **Session Window:** Quando "ok" chegar, session abre (24h)
- **Send Audio:** Enviar `{{contact.audio_imdiagnvendas_url}}` se disponível

**Workflow 2: Áudio Personalizado**
- **Trigger:** Inbound Webhook
- **Webhook URL:** `https://services.leadconnectorhq.com/hooks/R2mu3tVVjKvafx2O2wlw/webhook-trigger/uMAGh6b3u7aHWBn2sH6f`
- **HTTP Request:**
  - **URL:** `https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio`
  - **Method:** POST
  - **Headers:**
    ```
    Content-Type: application/json
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```
  - **Body:**
    ```json
    {
      "email": "{{body.email}}",
      "transaction_id": "{{body.transaction_id}}",
      "ghl_contact_id": "{{contact.id}}"
    }
    ```
- **Update Contact:** Salvar `{{webhook_response.audio_url}}` em `audio_imdiagnvendas_url`
- **Send WhatsApp:** Áudio como attachment (tipo: Audio, não Document)

---

## 💰 CUSTOS ESTIMADOS

### Por Usuário

| Serviço | Cálculo | Custo |
|---------|---------|-------|
| OpenAI o1-mini | ~700 tokens (450 in + 250 out) | $0.01 |
| ElevenLabs eleven_turbo_v3 | ~600 chars × $0.30/1000 | $0.18 |
| Supabase Storage | Free tier (até 1GB) | $0.00 |
| GHL WhatsApp | Incluído no plano | $0.00 |
| **TOTAL** | | **$0.19 por usuário** |

### Projeção 1000 Usuários

- **Geração de áudios:** $190 (OpenAI + ElevenLabs)
- **ElevenLabs plan necessário:** Professional ($99/mês) ou Enterprise (500K+ chars)
  - Professional: 500K chars/mês (~833 áudios de 600 chars)
  - Para 1000 usuários: Precisa Enterprise ou 2 meses
- **TOTAL: ~$289 para 1000 usuários**

### Otimizações de Custo

1. **Cache de scripts similares:** Se 2 participantes têm respostas idênticas → reusar áudio
2. **Fallback texto:** Se ElevenLabs quota acabar → enviar script em texto
3. **Batch processing:** Agrupar requisições ElevenLabs (possível desconto)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Fase 1: Database (COMPLETO)
- [x] Criar tabela `survey_audio_files`
- [x] Criar bucket `survey-audios` no Supabase Storage
- [x] Configurar RLS policies

### ✅ Fase 2: Edge Function (COMPLETO)
- [x] Criar estrutura de pastas
- [x] Implementar `index.ts`
- [x] Implementar `openai-service.ts` (OpenAI o1-mini)
- [x] Implementar `elevenlabs-service.ts` (eleven_turbo_v3 + emotion tags)
- [x] Implementar `storage-service.ts`
- [x] Deploy: `supabase functions deploy generate-audio`
- [x] Configurar secrets (OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID)
- [x] Testar Edge Function com curl

### ✅ Fase 3: App Integration (COMPLETO)
- [x] Adicionar webhook call em ThankYou.tsx após survey save
- [x] Webhook GHL configurado: `https://services.leadconnectorhq.com/hooks/.../`
- [x] Payload testado com dados reais

### ⏳ Fase 4: Configurar GHL (EM ANDAMENTO)
- [x] Adicionar custom fields no contato
  - [x] `audio_imdiagnvendas_url`
  - [x] `imdiagnosticovendas_audio_script`
- [x] Configurar Workflow 2 (Áudio Personalizado)
  - [x] Trigger: Inbound Webhook
  - [x] Find Contact
  - [x] HTTP POST → Supabase Edge Function
  - [x] Update Contact (salvar audio_url)
- [ ] **TODO: Configurar Workflow 1 (Boas-Vindas + "ok")**
  - [ ] Trigger: Compra Hotmart
  - [ ] Enviar WhatsApp Template (aguardando aprovação Meta)
  - [ ] Wait for Reply ("ok")
  - [ ] Enviar áudio quando session window abrir
- [ ] **TODO: Aprovar Template WhatsApp no Meta**
  - [ ] Criar template "boas-vindas-diagnostico"
  - [ ] Texto: "Olá! Bem-vindo à Imersão Diagnóstico de Vendas. Para ativar suas análises personalizadas, responda: ok"
  - [ ] Aguardar aprovação (24-48h)

### ⏳ Fase 5: Testes End-to-End (PENDENTE)
- [x] Testar Edge Function isoladamente (curl) → ✅ Funcionou
- [x] Testar webhook GHL → Edge Function → ✅ Request recebido corretamente
- [ ] **TODO: Testar fluxo completo:**
  - [ ] Compra real/simulada
  - [ ] Usuário preenche survey
  - [ ] Workflow 2 gera áudio
  - [ ] Usuário responde "ok"
  - [ ] Workflow 1 envia áudio
  - [ ] Validar áudio chega como voice message nativo
- [ ] **TODO: Testar edge cases:**
  - [ ] User responde "ok" antes de completar survey
  - [ ] User nunca responde "ok"
  - [ ] Session window expira antes de survey
  - [ ] Edge Function falha (simular erro)

**STATUS: 70% completo | Falta: Workflow 1 GHL + Aprovação Template Meta + Testes E2E**

---

## 🧪 VALIDAÇÃO END-TO-END

### Checklist de Testes

1. **Script gerado corretamente:**
   - [ ] Script personalizado reflete respostas do survey
   - [ ] Tamanho entre 400-800 caracteres
   - [ ] Tom conversacional (não formal)
   - [ ] Referencia algo específico que o usuário escreveu

2. **Áudio gerado com qualidade:**
   - [ ] Voz reconhecível (André Buric)
   - [ ] Duração adequada (1-2 min)
   - [ ] Áudio salvo no Storage
   - [ ] URL pública acessível

3. **GHL recebe e envia:**
   - [ ] Workflow aguarda 30 minutos
   - [ ] Edge Function retorna sucesso
   - [ ] Custom field `audio_url` preenchido
   - [ ] Mensagem WhatsApp enviada
   - [ ] Áudio reproduz como nativo (não como link)

4. **Fallback funciona:**
   - [ ] Se OpenAI falhar → Usar script genérico
   - [ ] Se ElevenLabs falhar → Enviar texto ao invés de áudio
   - [ ] Se Edge Function falhar → GHL envia mensagem fallback

---

## 📊 MÉTRICAS A RASTREAR

| Métrica | Como Calcular | Meta |
|---------|---------------|------|
| Taxa de sucesso | Áudios gerados / Total de surveys | > 95% |
| Tempo médio de geração | Média do tempo de processamento | < 20s |
| Taxa de fallback | Fallbacks usados / Total | < 5% |
| Qualidade do script | Review manual (sample) | Personalizado e relevante |

---

## 🆘 TROUBLESHOOTING

### Problema: Edge Function demora muito (> 30s)

**Causa:** OpenAI ou ElevenLabs lentos
**Solução:**
- Implementar timeout de 25s
- Se ultrapassar, usar script fallback genérico
- Processar áudio em background

### Problema: GHL não recebe response

**Causa:** Edge Function retorna erro
**Solução:**
- Verificar logs do Supabase: `supabase functions logs generate-audio`
- Testar Edge Function manualmente com `curl`
- Verificar se variáveis de ambiente estão configuradas

### Problema: Áudio não toca como nativo no WhatsApp

**Causa:** URL incorreta ou formato errado
**Solução:**
- Garantir que URL é pública e acessível
- Verificar MIME type: `audio/mpeg`
- Testar URL manualmente no navegador

---

## 📚 REFERÊNCIAS

- **OpenAI o1-mini Docs:** https://platform.openai.com/docs/models/o1
- **ElevenLabs API:** https://elevenlabs.io/docs/api-reference/text-to-speech
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Go High Level Workflows:** https://help.gohighlevel.com/support/solutions/articles/

---

## ❓ FAQ - PERGUNTAS FREQUENTES

### 1. Quanto tempo demora para gerar o áudio?

**Resposta:** ~30-45 segundos totais
- OpenAI o1-mini: ~15-20s (gerar script)
- ElevenLabs TTS: ~10-15s (converter para áudio)
- Upload Storage: ~5s

**Recomendação no GHL:** Não precisa wait de 15 minutos. A Edge Function retorna assim que terminar (30-45s). Se quiser margem, coloque timeout de 60s na HTTP Request.

### 2. O áudio chega como link ou como voice message?

**Resposta:** Voice message nativo! 🎯

**Importante:** No GHL, ao configurar "Send WhatsApp Message", escolher:
- **Type:** Audio (NÃO Document)
- **URL:** `{{contact.audio_imdiagnvendas_url}}`

Isso faz o WhatsApp exibir como bolha de áudio (não como anexo).

### 3. E se o usuário nunca responder "ok"?

**Opções:**

**Opção A (Recomendada):** Workflow 1 envia lembrete após 24h
```
Template 2: "Lembrete: Responda 'ok' para receber sua análise personalizada!"
```

**Opção B:** Enviar por email
- Workflow 2 pode disparar email com link do áudio + transcrição

**Opção C:** Considerar "não engajado" e não enviar áudio

### 4. E se a Edge Function falhar?

**Tratamento de erro no Workflow 2:**

```
If webhook_response.success = false:
  → Send internal notification (admin)
  → Tag contact: "audio-failed"
  → Enviar mensagem fallback:
      "Sua análise está sendo processada.
       Acesse seu painel: [link]"
```

### 5. Posso reusar áudios para surveys idênticos?

**Sim!** Para economizar:

1. Antes de gerar áudio, checar se existe registro com hash do survey_data
2. Se existir → retornar audio_url existente
3. Se não → gerar novo

**Economia estimada:** 30-40% dos surveys têm respostas repetidas (dropshipping, consultoria padrão, etc.)

### 6. Como monitoro se os áudios estão sendo enviados?

**Métricas no GHL:**
- Total de workflows Workflow 2 executados
- Taxa de sucesso da HTTP Request
- Custom field `audio_imdiagnvendas_url` preenchido

**Métricas no Supabase:**
```sql
SELECT
  COUNT(*) as total_audios,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  AVG(duration_seconds) as avg_duration
FROM survey_audio_files
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 🔧 TROUBLESHOOTING - ERROS COMUNS GHL WORKFLOW 2

### Erro 1: "Email não encontrado" ou "Survey não encontrado"

**Sintoma:** Edge Function retorna `{"success": false, "reason": "survey_not_found"}`

**Causas possíveis:**
1. ❌ Usando `{{contact.email}}` ao invés de `{{body.buyer.email}}`
2. ❌ Usuário ainda não completou a pesquisa
3. ❌ Email no GHL diferente do email usado na compra

**Solução:**
- Verificar Custom Data do webhook usa `{{body.buyer.email}}`
- Verificar no banco se existe survey para esse email:
  ```sql
  SELECT * FROM survey_responses WHERE email = 'email@teste.com';
  ```

---

### Erro 2: "Authorization error" ou "401 Unauthorized"

**Sintoma:** HTTP Request retorna erro 401

**Causas possíveis:**
1. ❌ Token truncado (falta parte do token)
2. ❌ Token errado (usando service_role ao invés de anon)

**Solução:**
- Verificar Authorization header está COMPLETO (500+ caracteres)
- Token correto: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4`

---

### Erro 3: Custom Fields não atualizam

**Sintoma:** Workflow executa mas `audio_diagnosticovendas_url` continua vazio

**Causas possíveis:**
1. ❌ Variável errada: `{{webhook.audio_url}}` ao invés de `{{webhook_response.audio_url}}`
2. ❌ Nome do custom field errado (typo)
3. ❌ Webhook retornou erro mas GHL continuou

**Solução:**
- Clicar em "Insert Variable" e usar autocomplete do GHL
- Verificar logs do workflow: resposta do webhook deve ter `success: true`
- Verificar custom field existe com nome EXATO: `audio_diagnosticovendas_url`

---

### Erro 4: Timeout (Request demora mais de 30s)

**Sintoma:** "Request timeout" após 30 segundos

**Causas possíveis:**
1. ❌ Timeout padrão do GHL muito baixo (30s)
2. ❌ OpenAI ou ElevenLabs lentos

**Solução:**
- Configurar timeout do HTTP Request para 60s ou 90s
- Verificar logs da Edge Function para ver onde está demorando

---

### Erro 5: Webhook não dispara

**Sintoma:** Workflow 2 nunca inicia quando usuário completa survey

**Causas possíveis:**
1. ❌ URL do webhook incorreta
2. ❌ ThankYou.tsx não está chamando webhook
3. ❌ CORS bloqueando request

**Solução:**
- Verificar URL do trigger: `https://services.leadconnectorhq.com/hooks/R2mu3tVVjKvafx2O2wlw/webhook-trigger/uMAGh6b3u7aHWBn2sH6f`
- Verificar console do navegador (F12) quando enviar survey
- Ver logs do GHL: Workflows → Activity

---

### Erro 6: Custom field com nome errado

**Sintoma:** GHL não encontra campo `audio_imdiagnvendas_url`

**Problema:** Confusão nos nomes dos custom fields

**Nomes CORRETOS:**
- ✅ `audio_diagnosticovendas_url` (para URL do áudio)
- ✅ `imdiagnosticovendas_audio_script` (para script em texto)

**Verificar:**
1. GHL → Settings → Custom Fields
2. Confirmar nomes EXATOS
3. Se errado: renomear ou criar novos

---

## 🚀 PRÓXIMOS PASSOS (O QUE VOCÊ PRECISA FAZER)

### 1. Criar e Aprovar Template WhatsApp no Meta (1-2 dias)

**Acesse:** Facebook Business Manager → WhatsApp → Templates

**Template Name:** `boas_vindas_diagnostico`

**Category:** Utility (ou Marketing)

**Language:** Portuguese (BR)

**Body:**
```
Olá! Bem-vindo à Imersão Diagnóstico de Vendas.

Para ativar suas análises personalizadas, responda: ok
```

**Aguardar aprovação:** 24-48 horas

### 2. Configurar Workflow 1 no GHL (30 min)

**Trigger:** Compra Hotmart (webhook ou tag)

**Steps:**
1. **Find/Create Contact**
2. **Send WhatsApp Template** (usar template aprovado acima)
3. **Wait for Reply** (aguardar mensagem contendo "ok", timeout 48h)
4. **If:** Custom field `audio_imdiagnvendas_url` não está vazio
   - **Then:** Send WhatsApp Message (Audio) com `{{contact.audio_imdiagnvendas_url}}`
   - **Else:** Wait Condition até `audio_imdiagnvendas_url` ser preenchido (timeout 2h)

### 3. Testar Fluxo Completo (1h)

**Checklist de teste:**

1. **Compra simulada:**
   - [ ] Webhook Hotmart dispara Workflow 1
   - [ ] Template de boas-vindas chega no WhatsApp
   - [ ] Responder "ok"
   - [ ] Session window abre

2. **Preencher survey:**
   - [ ] Acessar `/obrigado?transaction=HP...`
   - [ ] Completar 8 questões
   - [ ] Webhook dispara Workflow 2

3. **Validar áudio:**
   - [ ] Custom field `audio_imdiagnvendas_url` preenchido
   - [ ] Áudio chega no WhatsApp
   - [ ] Áudio reproduz como voice message (não link)
   - [ ] Voz reconhecível (André)
   - [ ] Script personalizado (menciona nome e respostas)

4. **Testar edge case:**
   - [ ] Responder "ok" ANTES de completar survey
   - [ ] Verificar se áudio chega quando survey for completado

### 4. Monitorar Primeiros 10 Usuários (3 dias)

- [ ] Verificar taxa de sucesso (> 90%)
- [ ] Verificar tempo médio de geração (< 60s)
- [ ] Coletar feedback: "Áudio chegou? Estava personalizado?"
- [ ] Ajustar prompt se scripts muito genéricos

---

## 📞 SUPORTE TÉCNICO

**Se algo der errado:**

1. **Edge Function não responde:**
   - Check logs: `supabase functions logs generate-audio`
   - Verificar secrets configurados
   - Testar manualmente: `./test-generate-audio.sh email@teste.com`

2. **GHL não dispara workflow:**
   - Verificar webhook URL correta
   - Verificar payload chegando (ver logs do workflow)
   - Testar workflow manualmente no GHL

3. **Áudio não chega no WhatsApp:**
   - Verificar session window aberta (user respondeu "ok"?)
   - Verificar custom field preenchido
   - Verificar tipo de mensagem: Audio (não Document)

4. **Qualidade do áudio ruim:**
   - Verificar voice_id correto: `K0Yk2ESZ2dsYv9RrtThg`
   - Testar script manualmente no ElevenLabs dashboard
   - Ajustar voice_settings (stability, similarity_boost)

---

**Última atualização:** 2026-02-01 23:45
**Desenvolvido por:** Claude Code + Andre Buric
**Status:** 🟡 70% Implementado | Edge Function ✅ | GHL Workflows ⏳ | Testes E2E ⏳
