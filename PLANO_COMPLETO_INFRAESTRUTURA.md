# Plano de Implementação - App Diagnóstico de Vendas

## Briefing Oficial

### Visão Geral
Este aplicativo é a **infraestrutura cognitiva** da Imersão Diagnóstico de Vendas.

**Não é:**
- Um curso
- Uma comunidade
- Um repositório de conteúdo

**É:**
- Um ambiente de diagnóstico ativo
- Acompanha o participante antes, durante e depois do evento
- Organiza o pensamento do participante em tempo real
- Registra diagnósticos e torna visíveis os gargalos reais da jornada de venda
- Conduz naturalmente à decisão de seguir para a Imersão IMPACT presencial

---

### Problema que o App Resolve

Eventos online de alto nível costumam gerar:
- Clareza momentânea
- Sensação de entendimento
- Empolgação intelectual

Mas na prática, a maioria dos participantes:
- Não consegue estruturar tudo sozinho
- Não sabe por onde começar
- Volta para a rotina sem sistema
- Adia decisões importantes

**O app elimina esse vácuo garantindo que:**
- O participante saia com um diagnóstico técnico da própria jornada
- Identifique onde exatamente a venda trava
- Entenda por que trava
- Perceba quando isso não pode ser resolvido sozinho

---

## INFRAESTRUTURA E BACKEND

### Contexto
- **Participantes esperados:** ~1000 pessoas (~700 presentes ativamente)
- **Duração:** 2 dias de evento
- **Preferência de visualização:** Airtable ou Baserow (interface familiar)
- **Data do evento:** 28/02/2026

---

### Arquitetura Recomendada: Supabase + Airtable/Baserow

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (React App - Vercel)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│    SUPABASE     │      │   OPENAI API    │
│  (Auth + Data   │      │  (Simulador IA) │
│   + Realtime)   │      │                 │
└────────┬────────┘      └─────────────────┘
         │
         │ Sync (webhook/cron)
         ▼
┌─────────────────┐
│ AIRTABLE/BASEROW│
│ (Visualização   │
│  para Admin)    │
└─────────────────┘
```

**Por que não só Airtable/Baserow?**
- Sem autenticação nativa
- Sem real-time (precisaria polling)
- Limite de records no free tier
- Não é ideal para 1000 usuários simultâneos

**Por que Supabase + Airtable/Baserow?**
- Supabase: Auth, real-time, segurança, performance
- Airtable/Baserow: Interface visual que você já conhece para monitorar
- Sync automático: Dados fluem do Supabase para sua planilha

---

### Modelo de Dados

```sql
-- USUÁRIOS
users (
  id, email, name, cpf,
  business_type, created_at, is_admin
)

-- COMPRAS
purchases (
  id, user_id, product_slug,
  purchased_at, price, status
)

-- DIAGNÓSTICOS
diagnostic_entries (
  id, user_id, event_day, block_number,
  inspiracao, motivacao, preparacao,
  apresentacao, conversao, transformacao,
  created_at
)

-- ESTADO DO EVENTO (singleton)
event_state (
  current_day, current_block, status
  -- status: 'offline' | 'live' | 'paused' | 'activity' | 'lunch'
)

-- NOTIFICAÇÕES
notifications (
  id, title, message, type,
  action_label, action_url, is_active
)

-- PROGRESSO GAMIFICATION
user_progress (
  user_id, xp, completed_steps,
  bonus_videos_watched
)

-- MENSAGENS WHATSAPP (geradas por IA)
whatsapp_messages (
  id, user_id, transaction_id, email,
  survey_data JSONB,     -- respostas da pesquisa
  prompt TEXT,           -- prompt enviado ao Claude
  generated_message TEXT, -- mensagem gerada
  used_fallback BOOLEAN, -- se usou mensagem generica
  status TEXT,           -- pending | sent | failed
  created_at, sent_at
)

-- RESPOSTAS DA PESQUISA
survey_responses (
  id, user_id, transaction_id, email,
  survey_data JSONB,     -- todas as respostas
  created_at
)
```

---

## Painel Admin (/admin) - Fluxo Detalhado

Rota protegida dentro do próprio app para usuários com `is_admin = true`.

---

### VISÃO GERAL DA INTERFACE ADMIN

```
┌─────────────────────────────────────────────────────────────┐
│  🎛️ PAINEL DE CONTROLE - IMERSÃO DIAGNÓSTICO               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  CONTROLE   │  │   AVISOS    │  │ PARTICIPAN. │         │
│  │  DO EVENTO  │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│       [TAB ATIVA]                                           │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│           [CONTEÚDO DA TAB SELECIONADA]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### TAB 1: CONTROLE DO EVENTO

**Cenário:** Você está no palco/bastidor e precisa sincronizar o app com o que está acontecendo.

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLE DO EVENTO                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATUS ATUAL:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔴 AO VIVO    DIA 1    BLOCO 3 de 7               │   │
│  │     "Motivação - Transformando interesse em desejo" │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PROGRESSO DO EVENTO:                                       │
│  ○───○───●───○───○───○───○                                  │
│  1   2   3   4   5   6   7                                  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐                        │
│  │  ◀ VOLTAR   │    │  AVANÇAR ▶  │                        │
│  │   BLOCO     │    │    BLOCO    │                        │
│  └─────────────┘    └─────────────┘                        │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ PAUSAR  │ │ATIVIDADE│ │ ALMOCO  │ │ENCERRAR │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  Status: offline | live | paused | activity | lunch        │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  AÇÕES RÁPIDAS:                                             │
│                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐      │
│  │  📅 INICIAR DIA 2     │  │  🏁 ENCERRAR EVENTO   │      │
│  │  (muda para Dia 2,    │  │  (marca is_live=false │      │
│  │   Bloco 1)            │  │   desbloqueia pós)    │      │
│  └───────────────────────┘  └───────────────────────┘      │
│                                                             │
│  PARTICIPANTES ONLINE: 📊 687 / 1000                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo na prática:**

1. **Antes do evento começar:**
   - Você abre /admin
   - Clica em "INICIAR TRANSMISSÃO" (toggle AO VIVO)
   - Todos os apps dos participantes mostram o badge "AO VIVO" pulsando

2. **Durante cada bloco:**
   - Você está falando no palco
   - Quando termina o bloco, pega o celular (ou alguém da equipe)
   - Clica "AVANÇAR BLOCO"
   - **Instantaneamente** todos os 700 apps atualizam:
     - LiveTicker muda para próximo bloco
     - Notificação aparece: "Bloco 4: Preparação começou!"

3. **Intervalo:**
   - Pode clicar "PAUSAR" (pausa geral)
   - Participantes veem "Em intervalo"

3b. **Atividade em andamento:**
   - Clicar "ATIVIDADE" durante exercicios
   - Participantes veem "ATIVIDADE EM ANDAMENTO" (cor roxa)
   - Diferencia de pausa normal

3c. **Almoco:**
   - Clicar "ALMOCO" no horario de almoco
   - Participantes veem "INTERVALO PARA ALMOCO"

4. **Fim do Dia 1:**
   - Clica "ENCERRAR DIA 1"
   - Notificação: "Dia 1 encerrado! Volte amanhã 9h30."
   - Bloqueia acesso ao Dia 2 até você iniciar

5. **Início do Dia 2:**
   - Clica "INICIAR DIA 2"
   - Reseta para Bloco 1 do Dia 2
   - Participantes podem preencher diagnóstico do Dia 2

---

### TAB 2: ENVIO DE AVISOS

**Cenário:** Você quer comunicar algo para todos os participantes em tempo real.

```
┌─────────────────────────────────────────────────────────────┐
│                    CENTRAL DE AVISOS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NOVO AVISO:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tipo: [▼ INFO    ]  [OFERTA] [ALERTA] [NPS]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Título: Intervalo de 15 minutos                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Mensagem: Aproveite para preencher seu diagnóstico │   │
│  │  do Bloco 3 antes de continuarmos.                  │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ☐ Adicionar botão de ação                                 │
│     Texto do botão: [Preencher agora]                      │
│     Link/Ação: [scroll-to-diagnostic]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        📤 ENVIAR PARA TODOS (687 online)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  AVISOS ENVIADOS HOJE:                                      │
│                                                             │
│  14:32 │ 🔔 INFO │ "Intervalo de 15 min" │ 687 receberam  │
│  13:15 │ ⚠️ ALERTA │ "Voltem para o bloco" │ 654 receberam │
│  09:35 │ 🔔 INFO │ "Bem-vindos ao Dia 1" │ 712 receberam  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tipos de aviso e quando usar:**

| Tipo | Visual | Quando usar |
|------|--------|-------------|
| 📘 INFO | Azul/Cyan | Informações gerais, lembretes |
| 🎁 OFERTA | Dourado | Oferta especial, desconto relâmpago |
| ⚠️ ALERTA | Vermelho | Urgente, problema técnico |
| ⭐ NPS | Roxo | Pedir feedback, avaliação |

**O que acontece no app do participante:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⬇️ Desliza do topo da tela                                │
├─────────────────────────────────────────────────────────────┤
│  🔔 AVISO DA ORGANIZAÇÃO                                   │
│                                                             │
│  Intervalo de 15 minutos                                    │
│  Aproveite para preencher seu diagnóstico                  │
│  do Bloco 3 antes de continuarmos.                         │
│                                                             │
│  ┌───────────────────┐                              ✕      │
│  │ Preencher agora   │                                     │
│  └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

**Avisos pré-configurados (templates):**

Para agilizar durante o evento, já teremos templates prontos:
- "Estamos começando! Abra seu app."
- "Intervalo de X minutos"
- "Voltamos em 5 minutos"
- "Preencha seu diagnóstico agora"
- "Oferta especial disponível!"
- "Como está sendo sua experiência? Avalie!"

---

### TAB 3: PARTICIPANTES

**Cenário:** Você quer ver quem está participando, status de compras, ou ajudar alguém específico.

```
┌─────────────────────────────────────────────────────────────┐
│                    PARTICIPANTES                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Buscar por nome ou email: [___________________]        │
│                                                             │
│  Filtros: [Todos ▼] [Online ▼] [Compraram ▼]              │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  RESUMO:                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  1000   │ │   687   │ │   156   │ │   312   │          │
│  │ Total   │ │ Online  │ │Compraram│ │ Diag.OK │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  │ Nome           │ Status │ XP  │ Compras    │ Ações    │ │
│  ├────────────────┼────────┼─────┼────────────┼──────────┤ │
│  │ João Silva     │ 🟢     │ 150 │ Dossiê     │ [Ver]    │ │
│  │ Maria Santos   │ 🟢     │ 200 │ -          │ [Ver]    │ │
│  │ Pedro Costa    │ ⚫     │  50 │ Aulas      │ [Ver]    │ │
│  │ Ana Oliveira   │ 🟢     │ 175 │ Dossiê+Imp │ [Ver]    │ │
│  │ ...            │        │     │            │          │ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📥 EXPORTAR CSV    📥 EXPORTAR PARA AIRTABLE      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Ao clicar em [Ver] de um participante:**

```
┌─────────────────────────────────────────────────────────────┐
│                  PERFIL: João Silva                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📧 joao.silva@email.com                                   │
│  📱 Online agora │ Último acesso: há 2 min                 │
│  🏢 Tipo de negócio: Consultoria B2B                       │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  DIAGNÓSTICO IMPACT:                                        │
│                                                             │
│        I    M    P    A    C    T                          │
│  Dia 1: 7    6    5    4    3    6   │ Score: 52%          │
│  Dia 2: 8    7    6    5    4    7   │ Score: 62%          │
│                                                             │
│  Gargalo: CONVERSÃO (média 3.5/10)                         │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  GAMIFICATION:                                              │
│  XP: 150 / 350  │  Badges: 🎯 🧠                           │
│  Etapas completadas: 4 de 7                                │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  COMPRAS:                                                   │
│  ✅ Dossiê do Negócio - R$297 - 27/02/2026                 │
│  ❌ Aulas Editadas - Não comprou                           │
│  ❌ Imersão IMPACT - Não comprou                           │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  AÇÕES:                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ + Marcar compra │  │ 📤 Enviar aviso │                  │
│  │   manualmente   │  │   individual    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### FLUXO COMPLETO: UM DIA DE EVENTO

**08:30 - Preparação:**
1. Abre /admin no celular ou tablet
2. Verifica quantos estão online (participantes testando)
3. Envia aviso: "Começamos em 1 hora!"

**09:25 - Pré-live:**
1. Clica "INICIAR TRANSMISSÃO"
2. Badge "AO VIVO" aparece em todos os apps
3. Envia aviso: "Estamos ao vivo! Abra seu app."

**09:30 - Bloco 1:**
1. Confirma que está no Bloco 1
2. Começa a apresentação
3. Participantes acompanham no LiveTicker

**10:15 - Fim do Bloco 1:**
1. Clica "AVANÇAR BLOCO" → vai para Bloco 2
2. Automático: notificação "Bloco 2: Inspiração"
3. Participantes que não preencheram diagnóstico do Bloco 1 veem lembrete

**12:30 - Intervalo almoço:**
1. Clica "PAUSAR"
2. Envia aviso: "Voltamos às 14h. Complete seu diagnóstico!"

**14:00 - Retorno:**
1. Clica "RETOMAR"
2. Envia aviso: "Voltamos! Bloco 4 começando."
3. Continua avançando blocos...

**18:00 - Fim do Dia 1:**
1. Clica "ENCERRAR DIA 1"
2. Envia aviso: "Dia 1 concluído! Seu diagnóstico: [Score]%"
3. Participantes veem resumo do dia

**Dia 2 - 09:30:**
1. Clica "INICIAR DIA 2"
2. Automático: reseta para Bloco 1 do Dia 2
3. Participantes podem preencher diagnóstico Dia 2

**Dia 2 - Final:**
1. Clica "ENCERRAR EVENTO"
2. Desbloqueia automaticamente:
   - Página Pós-Evento
   - Oferta da Imersão IMPACT
   - Download do relatório final

---

### SINCRONIZAÇÃO COM AIRTABLE/BASEROW

**Em tempo real, você também pode ver no Airtable:**

```
┌─────────────────────────────────────────────────────────────┐
│  AIRTABLE - Base: Imersão Diagnóstico 2026                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Participantes] [Diagnósticos] [Compras] [Métricas]       │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  View: Galeria de Kanban por Status                        │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ INSCRITOS   │ │ ATIVOS      │ │ COMPRARAM   │          │
│  │ (1000)      │ │ (687)       │ │ (156)       │          │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤          │
│  │ João Silva  │ │ Maria S.    │ │ Ana O.      │          │
│  │ Pedro Costa │ │ Carlos M.   │ │ Bruno L.    │          │
│  │ ...         │ │ ...         │ │ ...         │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Dados sincronizados:**
- Novos usuários → aparecem no Airtable em segundos
- Diagnósticos preenchidos → atualiza colunas I, M, P, A, C, T
- Compras → coluna "Status Compra" atualiza
- XP/Progresso → coluna "Gamification" atualiza

**Você pode usar o Airtable para:**
- Ver dashboards visuais (gráficos built-in)
- Filtrar participantes por critérios
- Exportar listas para email marketing
- Acompanhar métricas em tempo real

---

## Sistema de Mensagem WhatsApp Pos-Pesquisa (IA)

### Visao Geral
Apos o aluno completar a pesquisa de calibragem na Thank You Page (`/obrigado`),
o sistema gera uma mensagem personalizada via Claude API e salva no banco de dados.

**Decisao:** NAO enviar via WhatsApp API automaticamente. Apenas gerar o texto e salvar.

### Arquitetura

```
Aluno preenche pesquisa (ThankYou.tsx)
         │
         ▼
survey-config.ts (SINGLE SOURCE OF TRUTH)
  - Define perguntas da pesquisa
  - Cada pergunta tem promptLabel
  - Alteracoes aqui propagam para UI + prompt
         │
         ▼
whatsapp-message.ts
  - buildWhatsAppPrompt() → monta prompt para Claude
  - generateWhatsAppMessage() → chama API (TODO: Edge Function)
  - getFallbackMessage() → mensagem generica de backup
         │
         ▼
Supabase (futuro)
  - Tabela whatsapp_messages
  - Edge Function chama Claude API
  - Salva mensagem gerada
```

### Perguntas da Pesquisa (survey-config.ts)

| # | ID | Pergunta | Tipo | Condicional |
|---|-----|----------|------|-------------|
| 1 | motivacao | O que te motivou a entrar na Imersao? | textarea | - |
| 2 | tipoNegocio | Qual o tipo do seu negocio? | select (6 opcoes) | - |
| 3 | faturamento | Qual o faturamento mensal atual? | select (5 faixas) | - |
| 4 | maiorGargalo | Qual o maior gargalo nas suas vendas? | select (4 opcoes) | - |
| 5 | oQueJaTentou | O que ja tentou para resolver? | textarea | - |
| 6 | quantoInvestiu | Quanto ja investiu em mentorias/cursos? | select (4 faixas) | - |
| 7 | quaisMentorias | Quais mentorias ou cursos ja fez? | textarea | So aparece se quantoInvestiu != "Nunca investi" |
| 8 | oQueQuerResolver | O que espera resolver com a Imersao? | textarea | - |
| 9 | interesseAcompanhamento | Interesse em acompanhamento pos-evento? | select (3 opcoes) | - |

### Prompt Template (5 blocos)

1. **Saudacao** - Nome do aluno, tom acolhedor, reconhecer decisao
2. **Validacao + Diagnostico** - Refletir respostas, apontar gargalo, usar dados especificos
3. **Direcionamento para Dossie** - Video "Dossie de Inteligencia" com 7 Ruidos Neurais:
   - Identidade (00:00), Sequencia (05:30), Prova (11:00)
   - Complexidade (16:30), Urgencia (22:00), Comando (27:30), Dissonancia (33:00)
4. **Elevacao da Imersao** - Importancia dos 2 dias, app como ferramenta
5. **Fechamento** - Tom de parceria, assinatura Andre Buric

### Como Modificar Perguntas

1. Abrir `src/data/survey-config.ts`
2. Modificar array `SURVEY_QUESTIONS`
3. Nenhum outro arquivo precisa ser alterado
4. UI e prompt se adaptam automaticamente

### Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/data/survey-config.ts` | Config centralizada (single source of truth) |
| `src/lib/whatsapp-message.ts` | Gerador de prompt + mensagem |
| `src/pages/ThankYou.tsx` | Importa config, chama gerador apos pesquisa |

---

## Integracao de IA (Simulador)

**Abordagem:** Vercel AI SDK + OpenAI GPT-4o-mini

**Custo Estimado para o Evento:**
- 700 usuários × 10 interações × 1000 tokens = 7M tokens
- GPT-4o-mini: ~$5-15 total
- GPT-4o (se quiser melhor qualidade): ~$80-150 total

**Contexto injetado no prompt:**
```
Você é um consultor de vendas especializado.

Usuário: {nome}
Negócio: {tipo}
Diagnóstico IMPACT:
- Inspiração: {valor}/10
- Motivação: {valor}/10
- Preparação: {valor}/10
- Apresentação: {valor}/10
- Conversão: {valor}/10
- Transformação: {valor}/10

Gargalo principal: {etapa} ({valor}/10)
Bloco atual: {bloco} de 7

Ajude a entender e melhorar o processo de vendas.
```

**Limitações de segurança:**
- Rate limit: máx 5 mensagens/minuto por usuário
- Só liberado durante o evento (is_live = true)
- Histórico salvo para análise posterior

---

## PWA vs App Nativo - Comparativo Detalhado

### Opção 1: PWA (Progressive Web App)

**O que é:** O site atual "vira" um app instalável no celular.

**Como funciona:**
1. Usuário abre o site no Safari/Chrome
2. Clica em "Adicionar à Tela Inicial"
3. App aparece como ícone no celular
4. Abre em tela cheia, sem barra do navegador

**Vantagens:**
- ✅ Pronto em 1-2 dias (só adicionar manifest.json + service worker)
- ✅ Sem custo de loja (Apple $99/ano)
- ✅ Sem processo de aprovação (pode publicar quando quiser)
- ✅ Atualizações instantâneas (sem nova submissão)
- ✅ Funciona em iOS E Android
- ✅ Pode funcionar offline (cache de assets)

**Desvantagens:**
- ⚠️ Push notifications no iOS só em 16.4+ (2023)
- ⚠️ Alguns usuários não sabem "instalar"
- ⚠️ Ícone não aparece na App Store (menos credibilidade)
- ⚠️ Menos acesso a recursos nativos

**Ideal para:** Lançar rápido, validar, evento único

---

### Opção 2: App Nativo (via Capacitor)

**O que é:** O mesmo código React empacotado como app iOS/Android.

**Como funciona:**
1. Capacitor "envolve" o webapp em container nativo
2. Gera arquivos .ipa (iOS) e .apk (Android)
3. Submete para App Store e Google Play
4. Usuários baixam da loja

**Vantagens:**
- ✅ Push notifications funcionam 100%
- ✅ Aparece nas lojas (credibilidade)
- ✅ Experiência mais "nativa"
- ✅ Acesso a recursos do device (câmera, etc)
- ✅ Atualizações podem ser "over the air" com Capgo

**Desvantagens:**
- ⚠️ Apple Developer Program: $99/ano
- ⚠️ Processo de review: 3-7 dias (pode ser rejeitado)
- ⚠️ Cada atualização precisa nova submissão
- ⚠️ Precisa manter 2 builds (iOS + Android)
- ⚠️ Mais complexo de configurar

**Ideal para:** Produto consolidado, uso recorrente, múltiplos eventos

---

### Recomendação: Estratégia Híbrida

**Fase 1 - Para o evento (28/02):**
- Lançar como **PWA**
- Instruir participantes a "instalar" no celular
- Criar tutorial visual de como adicionar à tela inicial

**Fase 2 - Pós-evento (se sucesso):**
- Empacotar com **Capacitor**
- Submeter para App Store / Google Play
- Ter para próximos eventos

**Por que essa ordem?**
1. PWA não tem risco de rejeição da Apple
2. Dá tempo de validar antes de investir no nativo
3. Se o evento for sucesso, justifica o investimento
4. Usuários de eventos futuros baixam da loja

---

## Gamification Durante o Evento (Ao Vivo)

Atualmente gamification só existe no Pré-Evento. Expandir para:

**Ações que geram XP no Ao Vivo:**
| Ação | XP |
|------|-----|
| Preencher diagnóstico Dia 1 | +50 XP |
| Preencher diagnóstico Dia 2 | +50 XP |
| Completar cada bloco (7 blocos) | +10 XP cada |
| Usar Simulador IA pela primeira vez | +25 XP |
| Identificar gargalo (automático) | +20 XP |

**Novo total possível:** ~350 XP

**Badges/Conquistas:**
- 🎯 "Diagnóstico Completo" - Preencheu Dia 1 e Dia 2
- 🧠 "Consultor IA" - Usou o simulador 5x
- 🔥 "Maratonista" - Presente em todos os 7 blocos
- ⚡ "Early Bird" - Primeiro a completar diagnóstico

---

## Elementos Visuais Faltantes

1. **Patrocínio "Imersão IMPACT"**
   - Adicionar no footer de todas as páginas
   - Texto discreto: "Patrocinado por Imersão IMPACT"
   - Link para página da oferta (quando desbloqueada)

2. **PDF do Diagnóstico**
   - Para compradores do Dossiê
   - Supabase Storage para hospedar
   - Signed URL (link temporário seguro)
   - Botão de download no FinalReport

---

## Fases de Implementação

### FASE 1: Backend Core (Prioridade Máxima)
**Tempo estimado:** 1 semana

- [ ] Setup Supabase (projeto + tabelas)
- [ ] Autenticação real (email + CPF)
- [ ] Persistência de dados do diagnóstico
- [ ] Real-time: estado do evento
- [ ] Painel Admin básico (/admin)

### FASE 2: Funcionalidades de Evento
**Tempo estimado:** 1 semana

- [ ] Sistema de notificações em tempo real
- [ ] Gamification persistente (XP salvo)
- [ ] Rastreamento de compras
- [ ] Sync para Airtable/Baserow

### FASE 3: IA e Conteúdo Premium
**Tempo estimado:** 1 semana

- [ ] Integração OpenAI (Simulador IA)
- [ ] Entrega de PDF (Supabase Storage)
- [ ] Badge de patrocínio
- [ ] Gamification expandida (Ao Vivo)

### FASE 4: Mobile e Polish
**Tempo estimado:** 3-5 dias

- [ ] PWA (manifest.json + service worker)
- [ ] Tutorial de instalação
- [ ] Testes em iOS Safari
- [ ] Testes em Android Chrome

### FASE 5: Pós-Evento (Opcional)
- [ ] Capacitor setup
- [ ] Build iOS + Android
- [ ] Submissão para lojas

---

## Custos Estimados

| Item | Custo |
|------|-------|
| Supabase | $0 (free tier suficiente) |
| Vercel Hosting | $0 (free tier) |
| OpenAI API (evento) | $5-150 (depende do modelo) |
| Airtable/Baserow | $0 (free tier) |
| Apple Developer (se nativo) | $99/ano |
| **Total mínimo** | **~$5-50** |
| **Total com app nativo** | **~$150-250** |

---

## Arquivos a Criar/Modificar

```
src/
├── data/
│   ├── modules.ts            # ✅ 17 modulos do evento (0-16)
│   └── survey-config.ts      # ✅ Pesquisa - Single Source of Truth
├── lib/
│   ├── whatsapp-message.ts   # ✅ Gerador de prompt WhatsApp
│   ├── supabase.ts           # TODO: Cliente Supabase
│   ├── auth.ts               # TODO: Helpers de auth
│   └── ai.ts                 # TODO: Setup Vercel AI SDK
├── hooks/
│   ├── useAuth.ts            # TODO: Auth context
│   ├── useEventState.ts      # TODO: Real-time evento
│   ├── useNotifications.ts   # TODO: Real-time notificacoes
│   └── useDiagnostic.ts      # TODO: CRUD diagnostico
├── context/
│   ├── AuthContext.tsx        # TODO: Provider de sessao
│   └── EventContext.tsx       # TODO: Provider do evento
├── pages/
│   ├── Login.tsx              # ✅ Cockpit Access
│   ├── PreEvento.tsx          # ✅ Dashboard pre-evento
│   ├── AoVivo.tsx             # ✅ Durante o evento
│   ├── PosEvento.tsx          # ✅ Pos-evento
│   ├── Admin.tsx              # ✅ Painel de controle
│   ├── ThankYou.tsx           # ✅ Pos-compra (usa survey-config)
│   ├── Demo.tsx               # ✅ Demonstracao
│   ├── DevNav.tsx             # ✅ Navegacao dev
│   └── AIChat.tsx             # TODO: Simulador IA
├── components/ui/
│   ├── SponsorBadge.tsx       # TODO: Badge patrocinio
│   ├── AIChat.tsx             # TODO: Interface chat
│   └── InstallPrompt.tsx      # TODO: PWA prompt
└── public/
    ├── manifest.json          # TODO: PWA manifest
    └── sw.js                  # TODO: Service worker
```

---

## Filosofia do App

> **"ISSO NÃO É UM APP. É UMA MÁQUINA DE COMPROMETIMENTO."**

A execução visual transforma teoria em software que respira autoridade. O design tech/cyberpunk comunica:
- Seriedade
- Precisão
- Sistema (não achismo)
- Profissionalismo extremo

Cada elemento foi pensado para criar comprometimento psicológico, não apenas usabilidade.
