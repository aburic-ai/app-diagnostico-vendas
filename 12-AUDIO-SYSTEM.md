# 12. SISTEMA DE ÁUDIO PERSONALIZADO

**Última Atualização:** 2026-02-04
**Arquivos de Implementação:**
- Edge Function: `supabase/functions/generate-audio/`
- Migration: `supabase-migrations-survey-audio-files.sql`
- Status: ✅ Backend Completo + Integração GHL via API | ⏳ Aguardando teste E2E

---

## 📋 ÍNDICE

1. [Visão Geral](#visao-geral)
2. [Arquitetura e Fluxo](#arquitetura-e-fluxo)
3. [Templates WhatsApp](#templates-whatsapp)
4. [Workflow 2 - Configuração Detalhada](#workflow-2-configuracao-detalhada)
5. [Dados da Pesquisa](#dados-da-pesquisa)
6. [Geração de Script (OpenAI)](#geracao-de-script-openai)
7. [Conversão para Áudio (ElevenLabs)](#conversao-para-audio-elevenlabs)
8. [Implementação Técnica](#implementacao-tecnica)
9. [Configuração GHL Passo-a-Passo](#configuracao-ghl-passo-a-passo)
10. [Edge Cases e Tratamento](#edge-cases-e-tratamento)
11. [Testes e Validação](#testes-e-validacao)
12. [Monitoramento e Métricas](#monitoramento-e-metricas)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)
15. [Próximos Passos](#proximos-passos)
16. [Arquivos Relacionados](#arquivos-relacionados)

---

## 1. VISÃO GERAL

### Objetivo

Após a compra da Imersão Diagnóstico de Vendas, o participante preenche uma pesquisa de onboarding com 8 perguntas. Com base nessas respostas, o sistema:

1. Gera um **texto personalizado** usando OpenAI o1-mini
2. Converte o texto em **áudio** via ElevenLabs (voz do André Buric clonada)
3. Envia o **áudio via WhatsApp** através do Go High Level

**Resultado esperado:** Participante sente *"Finalmente alguém me entendeu"* + elevação de expectativa pela imersão + direcionamento para o Dossiê de Inteligência.

### Arquitetura de 2 Workflows

**Workflow 1: Mensagem de Boas-Vindas (Pós-Compra)**
- Trigger: Compra Hotmart
- Envia WhatsApp Template com link do app
- FIM (sem áudio, sem "ok")

**Workflow 2: Áudio Personalizado (Pós-Pesquisa)**
- Trigger: Webhook do App (survey_completed)
- Gera áudio via Edge Function
- Envia WhatsApp com áudio após user responder "ok"

---

## 2. ARQUITETURA E FLUXO

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
│    │ 2. OpenAI gpt-4o-mini → Script personalizado        │      │
│    │ 3. ElevenLabs TTS (eleven_v3) → MP3                 │      │
│    │    (voz André + emotion tags)                       │      │
│    │ 4. Upload → Supabase Storage                        │      │
│    │ 5. PUT GHL API → Atualiza custom fields             │      │
│    │    do contato diretamente via API                   │      │
│    │ 6. Retorna: { audio_url, script }                   │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                     │            │
│ 3. Recebe response ←────────────────────────────────┘            │
│    (custom fields JÁ foram atualizados pela Edge Function)      │
│ 4. Send WhatsApp Template: "imersao_diagnostico_pos_pesquisa_v01"│
│    "Protocolo recebido. Áudio pronto. Responda ok..."           │
│ 5. Wait for Reply ("ok")                                        │
│ 6. Send WhatsApp Message (Free-form, Audio)                     │
│    "Salve {{nome}}, ouça antes de qualquer outra coisa: [ÁUDIO]"│
└──────────────────────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ WHATSAPP                                                         │
│ Áudio chega como mensagem de voz nativa (não link/documento)    │
│ Duração: 1-2 minutos                                            │
└──────────────────────────────────────────────────────────────────┘
```

> **MUDANÇA IMPORTANTE (2026-02-04):** A Edge Function agora atualiza os custom fields
> do contato no GHL diretamente via API (`ghl-service.ts`), eliminando a necessidade do
> step "Update Contact" no Workflow 2 do GHL. Isso resolve o problema de timeout do GHL
> (que não esperava os ~30-60s de processamento).

---

## 3. TEMPLATES WHATSAPP

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
- `{{custom_values.imersao_diagnostico_entrada}}` = Data do evento (ex: "07/03 e 08/03")
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

---

### Por que GHL ao invés de Evolution API?

✅ **GHL é melhor porque:**
- WhatsApp nativo incluído no plano (sem custo extra)
- Workflow visual (fácil ajustar timing/mensagens)
- Custom fields para armazenar dados
- Tracking de conversas automático
- Menos infraestrutura (não precisa servidor Evolution)
- Um sistema só (CRM + WhatsApp)

---

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

## 4. WORKFLOW 2 - CONFIGURAÇÃO DETALHADA

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

---

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

---

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
- ✅ USE: `{{contact.id}}` (após Find Contact action) — necessário para a Edge Function atualizar o contato via API

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

> **NOTA (2026-02-04):** A Edge Function agora atualiza os custom fields do contato
> diretamente via API do GHL (usando `ghl_contact_id`). Portanto, o step "Update Contact"
> no workflow do GHL **NÃO é mais necessário**. Os custom fields `audio_diagnosticovendas_url`
> e `imdiagnosticovendas_audio_script` serão preenchidos automaticamente pela Edge Function.

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

#### ~~Action 2: Update Contact Field~~ — REMOVIDO (2026-02-04)

> Este step **não é mais necessário**. A Edge Function atualiza os custom fields
> diretamente via API do GHL usando o `ghl_contact_id` passado no payload.
> Os campos `audio_diagnosticovendas_url` e `imdiagnosticovendas_audio_script`
> são preenchidos automaticamente pelo `ghl-service.ts`.

---

### Passo 3: Branching (If/Else)

**Condição:** `{{webhook_response.success}}` = `true`

#### Branch A: Success (áudio gerado)

> **NOTA (2026-02-04):** O step "Update Contact" foi removido deste branch.
> Os custom fields agora são atualizados diretamente pela Edge Function via
> `ghl-service.ts`. Não é mais necessário parsear a resposta HTTP no GHL.

**3.1 Check Session Window (If/Else)**

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

## 5. DADOS DA PESQUISA

### Campos Capturados (8 Questões)

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

---

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

## 6. GERAÇÃO DE SCRIPT (OpenAI)

### Modelo e Configuração

**Modelo:** `gpt-4o-mini`
**Razão:** Rápido, barato, qualidade suficiente para análise de survey

**Configuração:**
```javascript
{
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: prompt }],
}
```

---

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

---

### Lógica de Direcionamento para o Vídeo

Com base no campo "onde_trava", direcione para os ruídos mais prováveis:

- Se "Atração" → Ruído de Identidade + Ruído de Prova
- Se "Oferta" → Ruído de Sequência + Ruído de Urgência
- Se "Fechamento" → Ruído de Comando + Ruído de Urgência
- Se "Processo" → Ruído de Complexidade + Ruído de Comando

**7 Ruídos Neurais (Dossiê de Inteligência):**
1. Ruído de Identidade - Cliente não sabe quem você é
2. Ruído de Sequência - Você tentou vender antes de criar contexto
3. Ruído de Prova - Falta de evidência tangível
4. Ruído de Complexidade - Informação demais
5. Ruído de Urgência - Cliente não vê motivo para decidir agora
6. Ruído de Comando - Falta direção clara
7. Ruído de Dissonância - Solução não combina com identidade do cliente

---

### Estrutura Obrigatória do Script

**Bloco 1 - Saudação (1-2 linhas)**
- Chamar pelo primeiro nome
- Mencionar que recebeu/analisou as respostas
- Tom: direto, sem firula
- Exemplo: "Fala, Marina! Aqui é o André. Recebi suas respostas e já analisei."

**Bloco 2 - Validação + Diagnóstico Rápido (3-5 linhas)**
- Baseado no faturamento + onde trava + o que já tentou
- Identificar o PADRÃO ou RISCO principal
- Mostrar que você ENTENDE o que ela está passando
- Referenciar algo específico que ela escreveu
- NÃO resolver o problema, apenas NOMEAR

**Bloco 3 - Direcionamento para o Vídeo (2-3 linhas)**
- Apontar para o Dossiê de Inteligência
- Indicar UM ou DOIS ruídos específicos
- Conectar com o problema que ela quer resolver

**Bloco 4 - Elevação da Imersão (2-3 linhas)**
- Deixar claro que vídeo é preparação, imersão é diagnóstico real
- Criar expectativa: "anota tudo"
- Reforçar: não é curso, é diagnóstico do negócio dela

**Bloco 5 - Fechamento (1 linha)**
- Despedida curta e firme
- "Te vejo na imersão" ou similar

---

### Regras Críticas de Formatação

- **Formato:** Script para ser lido em voz alta (natural, conversacional)
- **Tamanho:** 400-800 caracteres (MÁXIMO 800 - será 1-2 minutos de áudio)
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

---

### Exemplo de Script Completo

```
[happy] Fala, Marina! Aqui é o André. Recebi suas respostas e já dei uma olhada por aqui.

[thoughtful] Vi que você tem uma consultoria faturando entre 30 e 50 mil por mês... e marcou que o maior problema é fechamento — os leads chegam, a conversa flui, mas trava na hora H.

Você mencionou que já tentou scripts de vendas e até uma mentoria de copywriting, mas nada resolveu de verdade.

[serious] Isso me diz uma coisa: o problema provavelmente não é O QUE você fala. É QUANDO você fala e COMO você conduz.

[speaking with determination] Quero que você assista o Dossiê de Inteligência no seu painel. Presta atenção especial no Ruído de Comando e no Ruído de Urgência. Pelo que você descreveu, um desses dois está ativo.

[conversational] Mas lembra: o vídeo é a preparação. A imersão é onde a gente abre o seu caso de verdade.

Chega lá com tudo anotado.

[happy] Te vejo na imersão.
```

---

## 7. CONVERSÃO PARA ÁUDIO (ElevenLabs)

### Configuração da Voz

**Voice ID:** `K0Yk2ESZ2dsYv9RrtThg` (voz clonada do André Buric)
**Modelo:** `eleven_v3`
**Razão:** Mais expressivo, suporte nativo a emotion tags em colchetes, PT-BR nativo

**Voice Settings:**
```javascript
{
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
}
```

---

### Comparação de Modelos ElevenLabs

| Modelo | Velocidade | Qualidade | Emotion Tags | PT-BR Nativo |
|--------|-----------|-----------|--------------|--------------|
| `eleven_v3` | ~3-5s | Superior | ✅ Nativo (colchetes) | ✅ Sim |
| `eleven_turbo_v3` | ✅ ~2-3s | Boa | ✅ Sim | ✅ Sim |
| `eleven_multilingual_v2` | ~5-8s | Superior | ✅ Sim | ✅ Sim |

**Escolha:** `eleven_v3` ✅ (melhor qualidade de expressão vocal)

---

### Implementação (_shared/elevenlabs-service.ts)

```typescript
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
const ELEVENLABS_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID') || 'K0Yk2ESZ2dsYv9RrtThg'
const ELEVENLABS_MODEL = 'eleven_v3'

export async function convertTextToSpeech(text: string): Promise<{
  success: boolean
  audioBuffer?: Uint8Array
  requestId?: string
  duration?: number
  error?: string
}> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  )
  // Retorna { success, audioBuffer, requestId, duration }
}
```

---

## 8. IMPLEMENTAÇÃO TÉCNICA

### Estrutura de Arquivos

```
supabase/functions/generate-audio/
├── index.ts                    # Handler principal (13 steps)
├── _shared/
│   ├── openai-service.ts       # OpenAI gpt-4o-mini
│   ├── elevenlabs-service.ts   # ElevenLabs TTS (eleven_v3)
│   ├── storage-service.ts      # Supabase Storage
│   └── ghl-service.ts          # GHL API - atualiza custom fields
└── prompts/
    └── audio-script.ts         # Template do prompt
```

---

### Handler Principal (index.ts) — Fluxo de 13 Steps

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateScript, sanitizeScriptForTTS } from './_shared/openai-service.ts'
import { convertTextToSpeech, validateTextLength } from './_shared/elevenlabs-service.ts'
import { uploadAudio, checkBucketHealth } from './_shared/storage-service.ts'
import { updateContactCustomFields } from './_shared/ghl-service.ts'
import { generateAudioPrompt, getFallbackScript } from './prompts/audio-script.ts'

serve(async (req) => {
  // 1. Parsear payload { email, transaction_id, ghl_contact_id }
  // 2. Criar cliente Supabase (service role)
  // 3. Verificar bucket de storage
  // 4. Buscar survey_response (por transaction_id ou email)
  // 5. Idempotência: se áudio já existe, retorna cache
  //    → Também chama updateContactCustomFields() no cache hit
  // 6. Criar registro em survey_audio_files (status=processing)
  // 7. Gerar prompt personalizado
  // 8. Gerar script via OpenAI gpt-4o-mini (fallback se falhar)
  // 9. Converter para áudio via ElevenLabs eleven_v3
  // 10. Upload MP3 para Supabase Storage
  // 11. Atualizar registro (status=completed)
  // 12. Atualizar custom fields no GHL via API direta
  //     → PUT /contacts/{contactId} com audio_url + script
  // 13. Retornar { success, audio_url, script, duration_seconds }
})
```

**Ponto-chave — Step 12 (GHL Update Direto):**

A Edge Function agora chama a API do GHL diretamente para atualizar os custom fields,
ao invés de depender do Workflow do GHL para parsear a resposta HTTP. Isso resolve o
problema de timeout do GHL, que não conseguia esperar os ~30-60s de processamento.

```typescript
// Step 12 - Após gerar e salvar áudio
if (ghl_contact_id) {
  const ghlResult = await updateContactCustomFields(
    ghl_contact_id,
    uploadResult.publicUrl,
    finalScript
  )
}
```

### GHL Service (ghl-service.ts) — NOVO

```typescript
const GHL_API_KEY = Deno.env.get('GHL_API_KEY')
const GHL_API_BASE = 'https://services.leadconnectorhq.com'

// Custom field keys - devem bater com o configurado no GHL
const CUSTOM_FIELD_AUDIO_URL = 'audio_diagnosticovendas_url'
const CUSTOM_FIELD_AUDIO_SCRIPT = 'imdiagnosticovendas_audio_script'

export async function updateContactCustomFields(
  contactId: string,
  audioUrl: string,
  script: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: JSON.stringify({
      customFields: [
        { key: CUSTOM_FIELD_AUDIO_URL, field_value: audioUrl },
        { key: CUSTOM_FIELD_AUDIO_SCRIPT, field_value: script },
      ],
    }),
  })
  // ...
}
```

---

### Database Schema

**Tabela: `survey_audio_files`**

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

---

### Storage Bucket: `survey-audios`

- **Access:** Private (apenas autenticados podem fazer upload)
- **Max file size:** 10MB
- **MIME types:** `audio/mpeg`, `audio/mp3`

---

### Variáveis de Ambiente

**Configurado no Supabase (via Dashboard > Edge Functions > Manage Secrets):**

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-r-_onE...

# ElevenLabs
ELEVENLABS_API_KEY=sk_88880a4e...
ELEVENLABS_VOICE_ID=K0Yk2ESZ2dsYv9RrtThg

# GHL (Go High Level) — NOVO (2026-02-04)
GHL_API_KEY=pit-xxxxxxxx...
```

**Como obter a GHL_API_KEY:**
1. GHL Dashboard > Settings > Integrations > Private Integrations
2. Criar integração (ex: "Supabase Audio")
3. Scope necessário: **`contacts.write`** (apenas este)
4. Copiar a API Key gerada
5. Adicionar no Supabase: Dashboard > Edge Functions > Manage Secrets
   - Name: `GHL_API_KEY`
   - Value: a API Key copiada

---

### Performance e Custos

**Tempo estimado:** 30-45 segundos totais
- OpenAI gpt-4o-mini: ~5-10s (gerar script)
- ElevenLabs eleven_v3: ~10-15s (converter para áudio)
- Upload Storage: ~5s
- GHL API update: ~1-2s

**Custos por Áudio:**

| Serviço | Cálculo | Custo |
|---------|---------|-------|
| OpenAI gpt-4o-mini | ~700 tokens (450 in + 250 out) | ~$0.005 |
| ElevenLabs eleven_v3 | ~600 chars × $0.30/1000 | $0.18 |
| Supabase Storage | Free tier (até 1GB) | $0.00 |
| GHL WhatsApp | Incluído no plano | $0.00 |
| **TOTAL** | | **$0.19 por usuário** |

**Projeção 1000 Usuários:**
- Geração de áudios: $190 (OpenAI + ElevenLabs)
- ElevenLabs plan: Professional ($99/mês) ou Enterprise (500K+ chars)
  - Professional: 500K chars/mês (~833 áudios de 600 chars)
  - Para 1000 usuários: Precisa Enterprise ou 2 meses
- **TOTAL: ~$289 para 1000 usuários**

---

## 9. CONFIGURAÇÃO GHL PASSO-A-PASSO

### Pré-requisitos

✅ Edge Function deployada no Supabase
✅ Secrets configuradas (OpenAI, ElevenLabs, **GHL_API_KEY**)
✅ WhatsApp conectado no GHL
✅ Webhook Hotmart apontando para o GHL
✅ Private Integration criada no GHL (scope: `contacts.write`)

---

### Passo 1: Criar Custom Fields no GHL (5 min)

1. **Acesse:** GHL Dashboard → Settings → Custom Fields
2. **Criar Campo 1:**
   - **Label:** `audio_diagnosticovendas_url`
   - **Type:** Text
   - **Description:** URL do áudio personalizado gerado
   - **Placeholder:** https://supabase.co/storage/...

3. **Criar Campo 2:**
   - **Label:** `imdiagnosticovendas_audio_script`
   - **Type:** Long Text
   - **Description:** Script do áudio gerado pela IA
   - **Placeholder:** (deixar vazio)

4. **Salvar os campos**

---

### Passo 2: Criar Workflow no GHL (15 min)

**2.1 Criar Novo Workflow**

1. **Acesse:** GHL → Automation → Workflows
2. **Clique em:** "Create Workflow"
3. **Nome:** "Áudio Personalizado - Pós-Compra"
4. **Trigger:** Inbound Webhook

**2.2 Configurar Trigger**

- **Trigger Type:** Webhook
- **URL:** `https://services.leadconnectorhq.com/hooks/R2mu3tVVjKvafx2O2wlw/webhook-trigger/uMAGh6b3u7aHWBn2sH6f`

**2.3 Adicionar Step: Find/Create Contact**

Ver seção "Workflow 2 - Configuração Detalhada" → Passo 1

**2.4 Adicionar Step: HTTP Request**

Ver seção "Workflow 2 - Configuração Detalhada" → Passo 2 e "Guia Visual"

**2.5 Adicionar Step: Update Contact**

Ver seção "Workflow 2 - Configuração Detalhada" → Action 2

**2.6 Adicionar Step: Send WhatsApp**

Ver seção "Workflow 2 - Configuração Detalhada" → Passo 3.3

---

### Passo 3: Testar o Workflow (10 min)

**3.1 Teste Manual**

1. No GHL, clique em "Test Workflow"
2. Selecione um contato de teste (com email real)
3. Execute o workflow manualmente
4. Aguarde ~30-45 segundos (processamento do áudio)
5. Verifique:
   - ✅ Custom fields `audio_url` e `audio_script` preenchidos?
   - ✅ Mensagem WhatsApp enviada?
   - ✅ Áudio reproduz corretamente no WhatsApp?

**3.2 Verificar Logs da Edge Function**

Acesse: https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/logs/edge-functions

**3.3 Verificar Banco de Dados**

```sql
-- Ver áudios gerados
SELECT
  email,
  status,
  audio_url,
  LEFT(script_generated, 100) AS script_preview,
  created_at
FROM survey_audio_files
ORDER BY created_at DESC
LIMIT 10;
```

---

## 10. EDGE CASES E TRATAMENTO

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

---

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

---

### Caso 3: Survey Demora Muito para Ser Preenchido

**Cenário:**
1. User compra
2. User responde "ok" → session window abre
3. User demora 20 horas para preencher survey
4. Session window ainda está aberta (< 24h)
5. Workflow 2 gera áudio e envia

**Resultado:** Funciona perfeitamente. ✅

---

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

## 11. TESTES E VALIDAÇÃO

### Checklist de Testes

**1. Script gerado corretamente:**
- [ ] Script personalizado reflete respostas do survey
- [ ] Tamanho entre 400-800 caracteres
- [ ] Tom conversacional (não formal)
- [ ] Referencia algo específico que o usuário escreveu

**2. Áudio gerado com qualidade:**
- [ ] Voz reconhecível (André Buric)
- [ ] Duração adequada (1-2 min)
- [ ] Áudio salvo no Storage
- [ ] URL pública acessível

**3. GHL recebe e envia:**
- [ ] Workflow aguarda resposta da Edge Function
- [ ] Edge Function retorna sucesso
- [ ] Custom field `audio_url` preenchido
- [ ] Mensagem WhatsApp enviada
- [ ] Áudio reproduz como nativo (não como link)

**4. Fallback funciona:**
- [ ] Se OpenAI falhar → Usar script genérico
- [ ] Se ElevenLabs falhar → Enviar texto ao invés de áudio
- [ ] Se Edge Function falhar → GHL envia mensagem fallback

---

### Como Testar Manualmente

**Opção 1: Via Curl (Linha de Comando)**

```bash
curl -X POST \
  https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "email": "email-com-survey@exemplo.com",
    "ghl_contact_id": "test-123"
  }'
```

**Opção 2: Via Postman/Insomnia**

```
POST https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio

Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body:
{
  "email": "email-com-survey@exemplo.com",
  "ghl_contact_id": "test-123"
}
```

**Nota:** Só vai funcionar se houver um survey_response para esse email no banco.

---

### Teste End-to-End

**Fluxo completo:**
1. Compra real/simulada
2. Usuário preenche survey
3. Workflow 2 gera áudio
4. Usuário responde "ok"
5. Workflow 1 envia áudio
6. Validar áudio chega como voice message nativo

---

## 12. MONITORAMENTO E MÉTRICAS

### Métricas Importantes

| Métrica | Como Verificar | Objetivo |
|---------|----------------|----------|
| Taxa de Sucesso | Supabase Logs | > 95% |
| Tempo de Processamento | Edge Function Logs | < 45s |
| Áudios Gerados | `SELECT COUNT(*) FROM survey_audio_files WHERE status='completed'` | 100% dos surveys |
| Erros OpenAI | Logs: "OpenAI falhou" | < 1% |
| Erros ElevenLabs | Logs: "ElevenLabs falhou" | < 1% |

---

### Queries SQL para Monitoramento

**Ver áudios gerados:**
```sql
SELECT
  COUNT(*) as total_audios,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  AVG(audio_duration_seconds) as avg_duration
FROM survey_audio_files
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Ver áudios no storage:**
```sql
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

### Alertas Recomendados

1. **Taxa de erro > 5%:** Verificar API keys
2. **Tempo > 60s:** Verificar quotas OpenAI/ElevenLabs
3. **Áudio não enviado:** Verificar GHL WhatsApp conectado

---

## 13. TROUBLESHOOTING

### Problema: Edge Function demora muito (> 30s)

**Causa:** OpenAI ou ElevenLabs lentos
**Solução:**
- Implementar timeout de 25s
- Se ultrapassar, usar script fallback genérico
- Processar áudio em background

---

### Problema: GHL não recebe response

**Causa:** Edge Function retorna erro
**Solução:**
- Verificar logs do Supabase: `supabase functions logs generate-audio`
- Testar Edge Function manualmente com `curl`
- Verificar se variáveis de ambiente estão configuradas

---

### Problema: Áudio não toca como nativo no WhatsApp

**Causa:** URL incorreta ou formato errado
**Solução:**
- Garantir que URL é pública e acessível
- Verificar MIME type: `audio/mpeg`
- Testar URL manualmente no navegador

---

### Erro: "Email não encontrado" ou "Survey não encontrado"

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

### Erro: "401 Unauthorized"

**Sintoma:** HTTP Request retorna erro 401

**Causas possíveis:**
1. ❌ Token truncado (falta parte do token)
2. ❌ Token errado (usando service_role ao invés de anon)

**Solução:**
- Verificar Authorization header está COMPLETO (500+ caracteres)
- Token correto: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4`

---

### Erro: Custom Fields não atualizam

**Sintoma:** Áudio gerado mas `audio_diagnosticovendas_url` continua vazio no contato.
A API GHL retorna `{"succeded":true}` mas os campos ficam vazios.

**Causas possíveis (com ghl-service.ts — 2026-02-04):**
1. ❌ `GHL_API_KEY` não configurada no Supabase Secrets
2. ❌ API Key expirada ou inválida
3. ❌ Scope `contacts.write` não habilitado na Private Integration
4. ❌ Custom field keys no código (`ghl-service.ts:10-11`) não batem com o GHL
5. ❌ `ghl_contact_id` não passado no payload do webhook
6. ❌ **GOTCHA: Usando prefixo `contact.` na key** (ver abaixo)

**Solução:**
- Verificar logs da Edge Function: procurar por `[GHL]` nos logs
- Verificar se `GHL_API_KEY` está configurada: Dashboard > Edge Functions > Manage Secrets
- Verificar custom fields no GHL: `audio_diagnosticovendas_url` e `imdiagnosticovendas_audio_script`
- Verificar que o Workflow envia `ghl_contact_id: {{contact.id}}` no payload

---

### ⚠️ GOTCHA CRÍTICO: Prefixo `contact.` no payload da API

**O GHL mostra as keys dos custom fields na UI com o formato `{{ contact.nome_do_campo }}`.
Mas isso é apenas a sintaxe de merge tags para templates e workflows.**

**Na API (PUT /contacts/{id}), o `contact.` NÃO deve ser incluído no payload.**

A API aceita silenciosamente (retorna `{"succeded":true}`) mas **NÃO atualiza o campo**.

```
❌ ERRADO (API aceita mas NÃO atualiza):
{ "key": "contact.audio_diagnosticovendas_url", "field_value": "..." }

❌ TAMBÉM NÃO FUNCIONA (API aceita mas NÃO atualiza):
{ "key": "audio_diagnosticovendas_url", "field_value": "..." }

✅ ÚNICO FORMATO QUE FUNCIONA — usar UUID interno do campo:
{ "id": "h1uZ8V3KiGr1iUCcR0ib", "field_value": "..." }
```

**IMPORTANTE: A propriedade `key` NÃO funciona na prática.** Apesar da documentação oficial
do GHL mencionar `key` como opção, nos nossos testes apenas o `id` (UUID interno) atualiza
o campo de fato. A API aceita silenciosamente `key` e retorna sucesso sem atualizar nada.

**Formato que funciona na API v2 para customFields:**
```json
{
  "customFields": [
    { "id": "UUID_DO_CAMPO", "field_value": "valor" }
  ]
}
```

Para descobrir os UUIDs dos campos, usar:
`GET /locations/{locationId}/customFields?model=contact`

O `ghl-service.ts` faz isso automaticamente via `resolveCustomFieldIds()` antes de cada update.

**Referência:** [GHL API - Update Contact](https://marketplace.gohighlevel.com/docs/ghl/contacts/update-contact/index.html)

---

### Erro: Timeout (Request demora mais de 30s)

**Sintoma:** "Request timeout" após 30 segundos

**Causas possíveis:**
1. ❌ Timeout padrão do GHL muito baixo (30s)
2. ❌ OpenAI ou ElevenLabs lentos

**Solução:**
- Configurar timeout do HTTP Request para 60s ou 90s
- Verificar logs da Edge Function para ver onde está demorando

---

### Erro: Webhook não dispara

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

## 14. FAQ

### 1. Quanto tempo demora para gerar o áudio?

**Resposta:** ~20-35 segundos totais
- OpenAI gpt-4o-mini: ~5-10s (gerar script)
- ElevenLabs eleven_v3: ~10-15s (converter para áudio)
- Upload Storage: ~5s
- GHL API update: ~1-2s

**Recomendação no GHL:** Timeout de 60s na HTTP Request.

---

### 2. O áudio chega como link ou como voice message?

**Resposta:** Ainda em investigação (2026-02-04). Ver seção **17. DIÁRIO DE DEBUG: ENVIO WHATSAPP NATIVO**.

O áudio é gerado em **OGG Opus** (formato correto para WhatsApp), mas o envio como voice message nativo
via GHL API ainda não foi resolvido. Múltiplas abordagens foram testadas — ver detalhes na seção 17.

---

### 3. E se o usuário nunca responder "ok"?

**Opções:**

**Opção A (Recomendada):** Workflow 1 envia lembrete após 24h
```
Template 2: "Lembrete: Responda 'ok' para receber sua análise personalizada!"
```

**Opção B:** Enviar por email
- Workflow 2 pode disparar email com link do áudio + transcrição

**Opção C:** Considerar "não engajado" e não enviar áudio

---

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

---

### 5. Posso reusar áudios para surveys idênticos?

**Sim!** Para economizar:

1. Antes de gerar áudio, checar se existe registro com hash do survey_data
2. Se existir → retornar audio_url existente
3. Se não → gerar novo

**Economia estimada:** 30-40% dos surveys têm respostas repetidas (dropshipping, consultoria padrão, etc.)

---

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
  AVG(audio_duration_seconds) as avg_duration
FROM survey_audio_files
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

## 15. PRÓXIMOS PASSOS

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

---

### 2. Configurar Workflow 1 no GHL (30 min)

**Trigger:** Compra Hotmart (webhook ou tag)

**Steps:**
1. **Find/Create Contact**
2. **Send WhatsApp Template** (usar template aprovado acima)
3. **Wait for Reply** (aguardar mensagem contendo "ok", timeout 48h)
4. **If:** Custom field `audio_imdiagnvendas_url` não está vazio
   - **Then:** Send WhatsApp Message (Audio) com `{{contact.audio_imdiagnvendas_url}}`
   - **Else:** Wait Condition até `audio_imdiagnvendas_url` ser preenchido (timeout 2h)

---

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

---

### 4. Monitorar Primeiros 10 Usuários (3 dias)

- [ ] Verificar taxa de sucesso (> 90%)
- [ ] Verificar tempo médio de geração (< 60s)
- [ ] Coletar feedback: "Áudio chegou? Estava personalizado?"
- [ ] Ajustar prompt se scripts muito genéricos

---

## 17. DIÁRIO DE DEBUG: ENVIO WHATSAPP NATIVO (2026-02-04)

> **Contexto:** O áudio é gerado com sucesso (OGG Opus), salvo no Supabase Storage, e o custom field
> `audio_diagnosticovendas_url` é atualizado no contato do GHL. O problema é **como enviar esse áudio
> como voice message nativo no WhatsApp** (bolinha verde de play) em vez de link clicável.

### O que já foi feito

#### 1. Formato do áudio: MP3 → OGG Opus (RESOLVIDO)
- **elevenlabs-service.ts**: `output_format=opus_48000_128` + `Accept: audio/ogg`
- **storage-service.ts**: extensão `.ogg`, contentType `audio/mpeg` (bucket só aceita esse MIME)
- **Resultado**: Áudio regenerado com sucesso em OGG Opus (18.4s, ~100KB)
- **URL de teste**: `https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/4f7b0ba6-2ae1-4080-acea-7fb800c3bb69/1770231030050-andre-buric-gmail-com.ogg`

#### 2. Parâmetro `force` no generate-audio (RESOLVIDO)
- **generate-audio/index.ts**: Adicionado `force` no payload para pular cache de idempotência
- Permite regenerar áudio sem precisar deletar o registro anterior

#### 3. Edge Function send-whatsapp-audio (REESCRITA)
- **send-whatsapp-audio/index.ts**: Reescrita completa com:
  - Download do áudio do Supabase Storage
  - Upload para o CDN do GHL via `POST /conversations/messages/upload`
  - 3 tentativas de envio com payloads diferentes
  - Auto-detecção de formato (OGG vs MP3)
- **Deployada** em produção

#### 4. ghl-service.ts: sendWhatsAppAudio() (CRIADA)
- Função para enviar áudio via GHL Conversations API
- Usa `attachments: [audioUrl]` — NÃO é chamada de nenhum lugar atualmente
- Existe como alternativa à Edge Function send-whatsapp-audio

### O que foi testado e FALHOU

#### Tentativa A: `messageType: "Audio"` (string)
```json
{
  "type": "WhatsApp",
  "contactId": "...",
  "messageType": "Audio",
  "attachments": ["https://...audio.ogg"]
}
```
**Resultado**: HTTP 422 — `"messageType must be a number conforming to the specified constraints"`

**Descoberta**: O campo `messageType` é numérico e NÃO faz parte do request body do endpoint
`POST /conversations/messages`. Ele existe apenas nas RESPOSTAS da API (GET). A documentação
oficial do GHL não lista `messageType` como parâmetro de envio.

#### Tentativa B: Mesma coisa com URL do Supabase direto
**Resultado**: Mesmo 422

#### Tentativa C: `attachments` sem `messageType` (URL do GHL após upload)
```json
{
  "type": "WhatsApp",
  "contactId": "...",
  "attachments": ["https://storage.leadconnectorhq.com/..."]
}
```
**Resultado**: HTTP 400 — Twilio `ERR_BAD_REQUEST`

#### Tentativa D: `attachments` com URL do Supabase (sem upload pro GHL)
**Resultado**: Mesmo Twilio 400

#### Tentativa E: `message` com URL (funciona, mas ruim)
```json
{
  "type": "WhatsApp",
  "contactId": "...",
  "message": "https://...audio.ogg"
}
```
**Resultado**: Funciona, mas chega como **link clicável** — NÃO como áudio nativo. UX horrível.

### O que a pesquisa revelou

1. **GHL Conversations API `attachments` tem bug conhecido** — confirmado pela comunidade n8n.
   Mídia via WhatsApp com `attachments: [url]` falha silenciosamente ou retorna Twilio 400.

2. **O campo `messageType` NÃO existe no request body** — existe apenas nas respostas.
   O SDK oficial (`@gnosticdev/highlevel-sdk`) confirma que o `SendMessageBodyDto` aceita:
   `type`, `contactId`, `message`, `attachments`, `templateId`, etc. Sem `messageType`.

3. **Formatos de `type` aceitos**: `'SMS' | 'Email' | 'WhatsApp' | 'IG' | 'FB' | 'Custom' | 'Live_Chat'`
   Não existe `type: 'Audio'` ou similar.

4. **Recomendação da comunidade**: Usar a ação nativa **"WhatsApp: Media"** do GHL Workflow
   em vez da API. O Workflow tem integração interna com Twilio que funciona.

### Hipótese principal: GHL não aceita URLs externas como attachment

O GHL pode exigir que o arquivo esteja no **próprio CDN** (`storage.leadconnectorhq.com`).
A URL do Supabase é externa e pode ser rejeitada.

**Endpoint de upload de mídia do GHL** (diferente do upload de conversação):
```
POST https://services.leadconnectorhq.com/medias/upload-file
Content-Type: multipart/form-data

- file: (binário do .ogg)
- name: "audio.ogg"
- fileType: "audio/ogg"
```
Retorna URL interna do GHL. **AINDA NÃO TESTADO.**

### O que falta testar (próximos passos)

| # | Abordagem | Esforço | Confiança |
|---|-----------|---------|-----------|
| 1 | **GHL Workflow: WhatsApp Media action** com `{{contact.audio_diagnosticovendas_url}}` | Baixo (config no GHL) | Média |
| 2 | **Upload via `/medias/upload-file`** + envio com URL interna do GHL | Médio (código) | Média-Alta |
| 3 | **GHL Workflow: WhatsApp Media** com custom field File Upload (`imdiagnosticovendas_audio_file`) | Baixo (config no GHL) | Média |
| 4 | **Meta WhatsApp Business API** diretamente (bypass GHL) | Alto (nova integração) | Alta |

#### Abordagem 1: GHL Workflow nativo (testar primeiro)
No GHL Workflow, após o contato responder "ok":
- Ação: **Send WhatsApp** (ou **WhatsApp: Media**)
- Attachment/Media: `{{contact.audio_diagnosticovendas_url}}`
- Se funcionar = resolvido, sem código adicional

#### Abordagem 2: Upload para CDN do GHL via API
Modificar `send-whatsapp-audio` ou `generate-audio` para:
1. Baixar áudio do Supabase
2. Upload via `POST /medias/upload-file` (diferente do `/conversations/messages/upload`)
3. Salvar URL interna do GHL no custom field
4. Enviar via `attachments` com a URL do GHL

#### Abordagem 3: Custom field File Upload
- Criado campo `imdiagnosticovendas_audio_file` (tipo File Upload) no GHL
- Testar se o Workflow WhatsApp: Media action aceita esse campo como fonte de mídia
- Se sim, atualizar `ghl-service.ts` para popular esse campo também

#### Abordagem 4: Meta API direta (último recurso)
- Integrar diretamente com a WhatsApp Business API da Meta
- Bypass completo do GHL para envio de mídia
- Mais trabalho mas resultado garantido

### Estado dos arquivos (2026-02-04)

| Arquivo | Status | Notas |
|---------|--------|-------|
| `elevenlabs-service.ts` | Deployado | OGG Opus (`opus_48000_128`) |
| `storage-service.ts` | Deployado | `.ogg`, MIME `audio/mpeg` (workaround bucket) |
| `generate-audio/index.ts` | Deployado | Param `force` para regenerar |
| `ghl-service.ts` | Deployado | `resolveCustomFieldIds()`, `sendWhatsAppAudio()` (não usada) |
| `send-whatsapp-audio/index.ts` | Deployado | 3 tentativas, todas falharam |
| `audio-script.ts` | Sem mudanças | Prompt de geração OK |

### Dados de teste

- **Supabase project ref**: `yvjzkhxczbxidtdmkafx`
- **GHL Location ID**: `R2mu3tVvjKvefxzO2otw`
- **GHL Contact ID (teste)**: `YoxAcHrCogry28qpxfAV`
- **Email de teste**: `andre.buric@gmail.com`
- **Áudio gerado (OGG)**: URL salva no custom field `audio_diagnosticovendas_url` do contato
- **Custom fields GHL**: `audio_diagnosticovendas_url` (texto), `imdiagnosticovendas_audio_script` (texto), `imdiagnosticovendas_audio_file` (File Upload — novo, vazio)
- **Deploy cmd**: `npx supabase functions deploy <function-name> --project-ref yvjzkhxczbxidtdmkafx`

---

## 18. ARQUIVOS RELACIONADOS

### Migrations
- `supabase-migrations-survey-audio-files.sql` - Tabela + Storage bucket

### Edge Functions — generate-audio
- `supabase/functions/generate-audio/index.ts` - Handler principal (13 steps, param `force`)
- `supabase/functions/generate-audio/prompts/audio-script.ts` - Template de prompt OpenAI
- `supabase/functions/generate-audio/_shared/openai-service.ts` - OpenAI gpt-4o-mini
- `supabase/functions/generate-audio/_shared/elevenlabs-service.ts` - ElevenLabs TTS (eleven_v3, OGG Opus)
- `supabase/functions/generate-audio/_shared/storage-service.ts` - Upload Storage (OGG, MIME audio/mpeg)
- `supabase/functions/generate-audio/_shared/ghl-service.ts` - GHL API (custom fields + WhatsApp send)

### Edge Functions — send-whatsapp-audio
- `supabase/functions/send-whatsapp-audio/index.ts` - Envio WhatsApp via GHL (3 tentativas, todas falharam 2026-02-04)

### Documentação
- Este arquivo: [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md)

### Scripts de Teste
- `test-generate-audio.sh` - Script bash para testar Edge Function

---

## 📊 RESUMO - CHECKLIST COMPLETO

### Backend (Supabase) ✅ COMPLETO
- [x] Migration SQL executada
- [x] Tabela `survey_audio_files` criada
- [x] Storage bucket `survey-audios` criado
- [x] Edge Function `generate-audio` implementada e deployada (2026-02-04)
- [x] Edge Function `send-whatsapp-audio` implementada e deployada (2026-02-04)
- [x] Secrets configuradas (OpenAI + ElevenLabs + GHL_API_KEY + GHL_LOCATION_ID)
- [x] Integração GHL via API (ghl-service.ts) — atualiza custom fields com UUID
- [x] Formato OGG Opus (ElevenLabs `opus_48000_128`) para áudio nativo WhatsApp
- [x] Parâmetro `force` para regenerar áudios
- [x] Teste de geração OK (áudio gerado e salvo no Supabase)

### Integração GHL ✅ COMPLETO
- [x] Custom Fields criados (`audio_diagnosticovendas_url`, `imdiagnosticovendas_audio_script`)
- [x] Custom Field File Upload criado (`imdiagnosticovendas_audio_file`) — ainda não populado
- [x] Private Integration criada (scope: `contacts.write`)
- [x] GHL_API_KEY adicionada como secret no Supabase
- [x] Edge Function atualiza custom fields diretamente via API (resolve UUIDs automaticamente)

### Envio WhatsApp ❌ BLOQUEADO
- [x] Áudio gerado em OGG Opus (formato correto para WhatsApp nativo)
- [x] URL do áudio salva no custom field do contato GHL
- [ ] **BLOQUEADO: Envio como áudio nativo (bolinha de play) não funciona via API**
- [ ] **TODO: Testar GHL Workflow nativo (WhatsApp: Media action)**
- [ ] **TODO: Testar upload via `/medias/upload-file` + URL interna**
- [ ] **TODO: Se nada funcionar, avaliar Meta WhatsApp Business API direto**
- Ver seção 17 para detalhes completos

### GHL Workflows ⏳ PENDENTE
- [x] Workflow 2 configurado (simplificado — sem step "Update Contact")
- [ ] **TODO: Configurar Workflow 1 (Boas-Vindas + "ok")**
- [ ] **TODO: Aprovar Template WhatsApp no Meta**
- [ ] **TODO: Teste end-to-end realizado**
- [ ] Monitoramento ativo

---

**Desenvolvido por:** Claude Code + Andre Buric
**Data:** 2026-02-01
**Última Atualização:** 2026-02-04
**Status:** 🟡 75% Implementado | Geração ✅ | Storage ✅ | GHL Custom Fields ✅ | Envio WhatsApp ❌ | Workflows ⏳
