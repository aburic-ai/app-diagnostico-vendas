# 📝 Changelog - App Diagnóstico de Vendas

**Última atualização:** 2026-02-04

> **Nota:** O changelog principal e detalhado está em [02-CHANGELOG.md](./02-CHANGELOG.md). Este arquivo mantém um resumo das versões.

---

## [2.4.0] - 2026-02-04 🎯 EVENT PREP & UX POLISH

### Novas Features
- ✅ **Sistema de Presença** - Heartbeat 30s, status online/idle/offline
- ✅ **Admin: Filtros de Usuários** - Filtrar por online, ordenar por XP ou atividade recente
- ✅ **Admin: Status Indicators** - Bolinha verde/amarela/cinza + "Xmin atrás" em cada usuário
- ✅ **Plano 7 Dias: Todos os dias visíveis** - Dias futuros com blur + lock overlay
- ✅ **Plano 7 Dias: currentDay dinâmico** - Calculado a partir de `pos_evento_unlock_date`
- ✅ **Aulas Bônus trancadas** - Lock até 12/02/2026 com overlay visual
- ✅ **Mensagem contextual** - "Fase Concluída" após evento iniciar (pré-evento bloqueado)
- ✅ **Links de compra Hotmart** - Dossiê + Aulas Editadas com UTM tracking
- ✅ **LiveEventModal** - Redirecionamento automático quando evento está ao vivo
- ✅ **Compressão de imagem** - Auto-compress no upload de foto
- ✅ **Countdown dinâmico** - Usa datas do event_state do banco

### Correções
- ✅ Protocol survey exige completar antes de dar XP
- ✅ Notificações: subscription agora ouve DELETE events
- ✅ deleteAllNotifications verifica se rows foram deletadas (RLS check)
- ✅ Status online não aparecia no Gerenciar Usuários (query faltava last_seen_at)
- ✅ Msg "Aba será liberada" quando evento já começou → agora mostra "Fase Concluída"

### UI/UX
- ✅ Admin layout 70/30 → 65/35
- ✅ Removido botão PDF do Relatório Final
- ✅ Renomeado "Protocolo de Descompressão" → "Protocolo de Implementação"

### Arquivos Modificados (18+)
- `Admin.tsx`, `PreEvento.tsx`, `PosEvento.tsx`, `AoVivo.tsx`
- `ActionPlan.tsx`, `FinalReport.tsx`, `BottomNav.tsx`, `Countdown.tsx`
- `useNotifications.ts`, `useEventState.ts`, `useAIChat.ts`
- `LiveEventModal.tsx` (novo)
- E outros

---

## [2.0.0] - 2026-02-01 🔒 SEGURANÇA + FLUXO THANK YOU

### 🚨 CRITICAL - Sistema de Validação de Segurança

**Problema resolvido:** Vulnerabilidade crítica que permitia acesso não autorizado

#### Implementações:
- ✅ **Validação de compras** em múltiplas camadas (database + frontend)
- ✅ **Função SQL** `is_valid_buyer()` para validação centralizada
- ✅ **Row Level Security (RLS)** atualizado para bloquear inserções não autorizadas
- ✅ **Campo `manual_approval`** para override administrativo
- ✅ **UI "Acesso Negado"** com botão de suporte
- ✅ **Remoção do botão "Continuar sem verificação"** (bypass de segurança)

#### Arquivos modificados:
- `src/pages/ThankYou.tsx` - Validação completa integrada
- `supabase-validation-function.sql` (novo)
- `fix-survey-responses-rls-v2.sql` (novo)
- `supabase-migrations-purchases-v3.sql` (novo)

#### Documentação:
- [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md) - Documentação técnica completa
- [DEPLOY-SECURITY.md](./DEPLOY-SECURITY.md) - Guia rápido de deploy

**Validações implementadas:**
- ✅ `status = 'approved'` OU `manual_approval = true`
- ✅ `refunded_at IS NULL` (compras reembolsadas bloqueadas)
- ✅ `product_slug = 'imersao-diagnostico-vendas'` (produto correto)

---

### ✨ Reorganização do Fluxo Thank You Page

**Nova sequência:** Survey → Password → WhatsApp

#### Mudanças principais:
1. **Passo 1: PESQUISA DE CALIBRAGEM**
   - 8 questões do Protocolo de Iniciação
   - Sliders de 1-10
   - +30 XP ao completar

2. **Passo 2: CRIAR SENHA**
   - Validação forte (8+ caracteres, maiúscula, número)
   - Confirmação de senha
   - Cria conta automaticamente

3. **Passo 3: GRUPO WHATSAPP**
   - Indicadores visuais "Passo 1 de 2" e "Passo 2 de 2"
   - CTA claro para entrar no grupo
   - Auto-login após criar senha

#### Arquivos modificados:
- `src/pages/ThankYou.tsx` - Fluxo completo reorganizado
- `src/data/survey-config.ts` - Centralização da pesquisa

#### Melhorias UX:
- ✅ Passos numerados e alinhados visualmente
- ✅ Mensagens personalizadas com nome do comprador
- ✅ Feedback visual de progresso
- ✅ Validações em tempo real

---

## [1.5.0] - 2026-01-31 🎮 SISTEMA DE XP REDESENHADO

### Nova Distribuição: 1000 XP Total

**Meta:** PRÉ-EVENTO (200) + DURANTE EVENTO (400) + PÓS-EVENTO (400) = 1000 XP

#### Pré-Evento: 200 XP
| Atividade | XP | Status |
|-----------|-----|--------|
| Protocolo de Iniciação (8 questões) | 30 XP | ✅ |
| Complete seu Perfil | 30 XP | ✅ |
| Assistir Aulas Bônus | 60 XP | ✅ |
| Compra: Diagnóstico PDF | 40 XP | 🔄 |
| Compra: Aulas Editadas | 40 XP | 🔄 |

#### Durante Evento: 400 XP
| Atividade | XP | Quantidade | Total |
|-----------|-----|-----------|-------|
| Checkin de módulo | 20 XP | 17× | 340 XP |
| NPS Dia 1 | 30 XP | 1× | 30 XP |
| NPS Final | 30 XP | 1× | 30 XP |

#### Pós-Evento: 400 XP
| Atividade | XP | Status |
|-----------|-----|--------|
| Plano 7 Dias (progressivo) | 100 XP | 🔄 |
| - Dia 1 | 10 XP | 🔄 |
| - Dia 2 | 10 XP | 🔄 |
| - Dia 3 | 10 XP | 🔄 |
| - Dia 4 | 15 XP | 🔄 |
| - Dia 5 | 15 XP | 🔄 |
| - Dia 6 | 20 XP | 🔄 |
| - Dia 7 | 20 XP | 🔄 |
| Inscrição IMPACT | 300 XP | 🔄 |

#### Arquivos criados/modificados:
- `src/config/xp-system.ts` (novo) - Configuração centralizada
- `src/pages/PreEvento.tsx` - Integração com novo sistema
- `src/pages/AoVivo.tsx` - Checkins com 20 XP
- `src/pages/PosEvento.tsx` - Plano 7 dias
- `src/components/ui/ProfileCard.tsx` - Display de nível e XP

#### Sistema de Níveis:
```
0-99 XP    → Novato
100-199 XP → Iniciante
200-399 XP → Iniciante+
400-599 XP → Intermediário
600-999 XP → Avançado
1000 XP    → Mestre IMPACT
```

---

## [1.4.0] - 2026-01-31 📦 WEBHOOK HOTMART + GOOGLE SHEETS

### Webhook Hotmart

#### Implementação:
- ✅ Edge Function `/hotmart-webhook` criada
- ✅ Processar eventos: `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED`
- ✅ Auto-criação de usuário se não existir
- ✅ Formatação de nome (apenas primeiro nome em Title Case)
- ✅ Validação de signature Hotmart

#### Arquivos:
- `supabase/functions/hotmart-webhook/index.ts`
- `supabase-migrations-purchases-v2.sql` - Campos adicionais (buyer_name, buyer_document, buyer_phone, full_price)

#### Documentação:
- [DEPLOY-WEBHOOK.md](./DEPLOY-WEBHOOK.md)
- [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md)

---

### Google Sheets Integration (🔄 Pendente)

**Objetivo:** Sincronizar dados de participantes em planilha administrativa

#### Colunas planejadas:
- Dados básicos: Email, Nome, Telefone, Empresa, Cargo
- Progresso: XP Total, Nível, Módulos Confirmados, Plano 7 Dias
- Compras: PDF, Aulas, IMPACT (transaction IDs)
- Feedback: NPS Dia 1, NPS Final
- Protocolo: 8 respostas de calibragem
- Timestamps: Data Inscrição, Última Atividade

#### Status: Planejado (não implementado)
- [ ] Setup Google Cloud Service Account
- [ ] Edge Function `/sync-google-sheets`
- [ ] Cron Job (10 min)

---

## [1.3.0] - 2026-01-30 🎯 ADMIN + SUPABASE REAL DATA

### Admin Dashboard

#### Melhorias:
- ✅ Substituído mocks por dados reais do Supabase
- ✅ Fetch automático a cada 30 segundos
- ✅ Ordenação por XP (maior primeiro)
- ✅ Exibição de atividade real dos usuários

#### Arquivos:
- `src/pages/Admin.tsx` - Queries reais do Supabase

---

### Integração Supabase Completa

#### Database:
- ✅ Tabelas: `profiles`, `purchases`, `survey_responses`, `nps_responses`, `whatsapp_messages`
- ✅ Real-time habilitado para `profiles`
- ✅ RLS (Row Level Security) configurado
- ✅ Triggers automáticos para criar profile após signup

#### Auth:
- ✅ Sign up / Login
- ✅ Context global (`AuthContext`)
- ✅ Subscription real-time de perfil

#### Arquivos:
- `src/lib/supabase.ts` - Cliente Supabase
- `src/contexts/AuthContext.tsx` - Context de autenticação
- `src/hooks/useUserProgress.ts` - Hook de progresso

---

## [1.2.0] - 2026-01-29 🎨 DESIGN SYSTEM + RADAR CHART

### Design System

#### Theme tokens:
```typescript
colors: {
  background: { primary, secondary, tertiary }
  text: { primary, secondary, muted }
  accent: { cyan, purple, orange }
  status: { success, warning, danger }
}
typography: { fontFamily, fontSize, fontWeight }
spacing: { xs, sm, md, lg, xl, xxl }
borderRadius: { sm, md, lg, full }
```

#### Componentes UI:
- ✅ `AppLayout` - Layout responsivo
- ✅ `PageWrapper` - Background animado
- ✅ `Button` - Beam animation
- ✅ `Card` - Glassmorphism variants (default, cyan, purple, orange)
- ✅ `Input` - Gradient border
- ✅ `RadarChart` - Gráfico IMPACT
- ✅ `Countdown` - Timer regressivo
- ✅ `ProgressBar` - Barra com glow
- ✅ `BottomNav` - Navegação sequencial
- ✅ `LiveTicker` - Status ao vivo
- ✅ `DiagnosticSlider` - Slider de diagnóstico

#### Documentação:
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## [1.1.0] - 2026-01-28 📊 MÓDULOS + PESQUISA

### Dados do Evento

#### 17 Módulos (Dia 1 + Dia 2):
- ✅ Módulo 0: INÍCIO DO DIAGNÓSTICO
- ✅ Módulos 1-8: Dia 1 (FRICÇÃO, PERCEPÇÃO, ARQUITETURA, etc.)
- ✅ Módulos 9-16: Dia 2 (RETOMADA, PROFUNDIDADE, SIMULAÇÃO, etc.)

#### Arquivos:
- `src/data/modules.ts` - Configuração de todos os módulos
- `src/data/survey-config.ts` - Pesquisa de calibragem (Single Source of Truth)

---

### Pesquisa de Calibragem

**8 questões de diagnóstico:**
1. Método Atual
2. Consistência de Resultados
3. Velocidade do Ciclo
4. Aquisição de Clientes
5. Tamanho do Negócio (Ticket Médio)
6. Previsibilidade
7. Objeções
8. Conversas de Venda

#### Características:
- ✅ Sliders de 1-10
- ✅ Labels contextuais (Esquerda: problema, Direita: solução)
- ✅ Orientações claras
- ✅ Salvo no Supabase (`survey_responses`)

---

## [1.0.0] - 2026-01-27 🚀 MVP INICIAL

### Estrutura Base

#### Rotas criadas:
- `/login` - Login
- `/pre-evento` - Pré-Evento
- `/ao-vivo` - Ao Vivo
- `/pos-evento` - Pós-Evento
- `/admin` - Admin
- `/obrigado` - Thank You
- `/demo` - Demo
- `/dev` - DevNav

#### Stack:
- ⚛️ React + Vite
- 📘 TypeScript
- 🎨 Framer Motion
- 🎯 Lucide Icons
- ☁️ Vercel (deploy)
- 🗄️ Supabase (backend)

---

## 📁 Estrutura do Projeto

```
app-diagnostico-vendas/
├── src/
│   ├── components/
│   │   └── ui/              # Componentes reutilizáveis
│   ├── config/
│   │   └── xp-system.ts     # Sistema de XP centralizado
│   ├── contexts/
│   │   └── AuthContext.tsx  # Context de autenticação
│   ├── data/
│   │   ├── modules.ts       # 17 módulos do evento
│   │   └── survey-config.ts # Pesquisa de calibragem
│   ├── hooks/
│   │   └── useUserProgress.ts # Hook de progresso
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── whatsapp-message.ts # Gerador de mensagem IA
│   ├── pages/               # Páginas da aplicação
│   ├── styles/              # Theme tokens
│   └── App.tsx              # Rotas
├── supabase/
│   └── functions/
│       └── hotmart-webhook/ # Edge Function webhook
├── *.sql                    # Migrations SQL
├── *.md                     # Documentação
└── package.json
```

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais

#### `profiles`
```sql
- id (uuid, PK)
- email (text, unique)
- name (text)
- phone (text)
- company (text)
- role (text)
- photo_url (text)
- xp (integer, default 0)
- completed_steps (text[], default [])
- created_at, updated_at
```

#### `purchases`
```sql
- id (uuid, PK)
- user_id (uuid, FK → profiles)
- transaction_id (text, unique)
- product_slug (text)
- price (numeric)
- full_price (numeric)
- buyer_name (text)
- buyer_document (text)
- buyer_phone (text)
- status (text: 'approved', 'refunded', 'cancelled')
- refunded_at (timestamptz, nullable)
- manual_approval (boolean, default false)  // ✨ NOVO
- purchased_at, created_at
```

#### `survey_responses`
```sql
- id (uuid, PK)
- user_id (uuid, FK → profiles, nullable)
- transaction_id (text, nullable)
- email (text, nullable)
- survey_data (jsonb)
- created_at
```

#### `nps_responses`
```sql
- id (uuid, PK)
- user_id (uuid, FK → profiles)
- type (text: 'day1', 'final')
- score (integer, 0-10)
- feedback (text, nullable)
- created_at
```

#### `whatsapp_messages`
```sql
- id (uuid, PK)
- transaction_id (text)
- email (text, nullable)
- survey_data (jsonb)
- prompt (text)
- message (text)
- created_at
```

### Funções SQL

#### `is_valid_buyer()` ✨ NOVO
```sql
-- Valida se email/transaction pertence a comprador válido
-- Retorna: is_valid, purchase_id, user_id, buyer_name, reason
```

### RLS Policies

- ✅ `profiles` - Usuários só veem próprio perfil
- ✅ `purchases` - Usuários só veem próprias compras
- ✅ `survey_responses` - **Validação estrita por compra** ✨ ATUALIZADO
- ✅ `nps_responses` - Usuários só inserem próprias respostas

---

## 🚀 Deploy

### Frontend (Vercel)
```bash
git push origin main  # Auto-deploy
```

### Backend (Supabase)

**Migrations SQL:**
```bash
# Executar no SQL Editor (nesta ordem):
1. supabase-validation-function.sql
2. fix-survey-responses-rls-v2.sql
3. supabase-migrations-purchases-v3.sql
```

**Edge Functions:**
```bash
supabase functions deploy hotmart-webhook
# supabase functions deploy sync-google-sheets  # Pendente
```

---

## 📚 Documentação Completa

### Segurança
- [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md) - 🔒 Sistema de validação (CRÍTICO)
- [DEPLOY-SECURITY.md](./DEPLOY-SECURITY.md) - Guia rápido de deploy

### Integrações
- [DEPLOY-WEBHOOK.md](./DEPLOY-WEBHOOK.md) - Deploy webhook Hotmart
- [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md) - Docs webhook

### Design
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Sistema de design
- [PLANO_COMPLETO_INFRAESTRUTURA.md](./PLANO_COMPLETO_INFRAESTRUTURA.md) - Arquitetura

### SQL
- `supabase-validation-function.sql` - Função de validação ✨
- `fix-survey-responses-rls-v2.sql` - RLS atualizado ✨
- `supabase-migrations-purchases-v3.sql` - Manual approval ✨
- `supabase-migrations-purchases-v2.sql` - Campos comprador

---

## 🎯 Status das Features

### ✅ Implementado (Produção)
- [x] Sistema de autenticação (Supabase Auth)
- [x] Thank You Page com validação de compras
- [x] Sistema de XP redesenhado (1000 XP)
- [x] Pré-Evento com gamification + aulas bônus
- [x] Ao Vivo com checkins de módulos
- [x] Pós-Evento com Plano 7 Dias (IA + fallback)
- [x] Webhook Hotmart
- [x] Admin Dashboard com dados reais + presença + filtros
- [x] RLS completo e seguro
- [x] Pesquisa de calibragem (8 questões)
- [x] Real-time updates via Supabase
- [x] Sistema de presença em tempo real (heartbeat 30s)
- [x] Links de compra Hotmart com UTM tracking
- [x] Countdown dinâmico baseado em event_state

### 🔄 Em Progresso
- [ ] Google Sheets Integration
- [ ] Personalização do plano de ação IA
- [ ] RLS policy DELETE para notifications

### 📋 Planejado
- [ ] Admin - seção "Inscritos IMPACT"
- [ ] Badges/Achievements visuais
- [ ] Push notifications (optional)
- [ ] Analytics dashboard

---

## 🐛 Issues Conhecidos

### Resolvidos ✅
- [x] ~~Profile modal não salvava dados~~ → RESOLVIDO (handleSaveProfile)
- [x] ~~XP não persistia no banco~~ → RESOLVIDO (useUserProgress hook)
- [x] ~~Botão "Continuar sem verificação" permitia bypass~~ → RESOLVIDO (removido)
- [x] ~~RLS permitia inserções anônimas~~ → RESOLVIDO (policy atualizada)

### Abertos 🔄
- [ ] Google Sheets sync não implementado
- [ ] Manual approval UI no Admin (planejado)
- [ ] Testes end-to-end de compra → XP → Google Sheets

---

## 📞 Suporte

**Em caso de problemas:**
1. Verificar [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md)
2. Checar logs do Supabase
3. Consultar [DEPLOY-SECURITY.md](./DEPLOY-SECURITY.md)
4. Escalar para dev team

---

## 🔗 Links Úteis

- **Supabase Dashboard:** [Link do projeto]
- **Vercel Dashboard:** [Link do projeto]
- **Hotmart:** [Painel de webhooks]
- **Produção:** https://app-diagnostico-vendas.vercel.app

---

**Última revisão:** 2026-02-04
**Versão atual:** 2.4.0
**Próxima milestone:** Evento 28/02 - Validação final + Google Sheets

---

**FIM DO CHANGELOG**
