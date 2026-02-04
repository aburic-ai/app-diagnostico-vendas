# 02. CHANGELOG

**Projeto:** App Diagnóstico de Vendas
**Última Atualização:** 2026-02-04

---

## 📋 ÍNDICE

- [2.4.0 - 2026-02-04: Event Prep & UX Polish](#240---2026-02-04-event-prep--ux-polish)
- [2.3.0 - 2026-02-03: Documentation Reorganization](#230---2026-02-03-documentation-reorganization)
- [2.2.0 - 2026-02-02 (Part B): Admin Improvements](#220---2026-02-02-part-b-admin-improvements)
- [2.1.0 - 2026-02-02 (Part A): Critical Fixes](#210---2026-02-02-part-a-critical-fixes)
- [2.0.0 - 2026-02-01: Security + Thank You](#200---2026-02-01-security--thank-you)
- [1.5.0 - 2026-01-31: XP System Redesigned](#150---2026-01-31-xp-system-redesigned)
- [1.4.0 - 2026-01-31: Webhook Hotmart](#140---2026-01-31-webhook-hotmart)
- [1.3.0 - 2026-01-30: Admin + Supabase Integration](#130---2026-01-30-admin--supabase-integration)
- [1.2.0 - 2026-01-29: Design System + Radar Chart](#120---2026-01-29-design-system--radar-chart)
- [1.1.0 - 2026-01-28: Modules + Survey](#110---2026-01-28-modules--survey)
- [1.0.0 - 2026-01-27: Initial MVP](#100---2026-01-27-initial-mvp)

---

## [2.4.0] - 2026-02-04: Event Prep & UX Polish

### 🎯 Preparação Final para o Evento

Grande rodada de melhorias de UX, correções e novas funcionalidades focadas na experiência do participante e do administrador antes do evento (28/02).

---

#### 1. Sistema de Presença em Tempo Real

**Novo:** Heartbeat system que atualiza `last_seen_at` a cada 30 segundos.

**Implementação:**
- ✅ Hook `useHeartbeat` atualiza presença no banco
- ✅ Campo `last_seen_at` na tabela `profiles`
- ✅ Status automático: **Online** (<10min), **Idle** (<30min), **Offline** (>30min)

**Arquivos:**
- `src/hooks/useHeartbeat.ts`
- `src/pages/PreEvento.tsx`, `src/pages/AoVivo.tsx`, `src/pages/PosEvento.tsx`

---

#### 2. Admin: Indicadores de Presença e Filtros

**Gerenciar Usuários agora mostra:**
- ✅ Bolinha verde (online), amarela (idle) ou cinza (offline) ao lado de cada usuário
- ✅ Label temporal ("agora", "5min atrás", "2h atrás", "3d atrás")
- ✅ Filtro por status: botão "Online" para ver apenas usuários ativos
- ✅ Ordenação: por XP (padrão) ou por atividade recente
- ✅ Layout alterado de 70/30 para 65/35 split

**Arquivo:** `src/pages/Admin.tsx`

**Detalhes técnicos:**
- Query `fetchAllUsers` agora inclui `last_seen_at` no select
- Filtro online: `(Date.now() - last_seen_at) / 1000 / 60 < 10`
- Sort por XP: `(b.xp || 0) - (a.xp || 0)`
- Sort por recente: `bTime - aTime` baseado em `last_seen_at`

---

#### 3. Plano de Ação 7 Dias: Todos os Dias Visíveis

**Antes:** Apenas dias desbloqueados eram mostrados.

**Depois:** Todos os 7 dias são exibidos, com dias futuros travados visualmente:
- ✅ Conteúdo com `blur(4px)` e `opacity: 0.3`
- ✅ Overlay gradiente com ícone Lock e badge "Dia X"
- ✅ Click desabilitado em dias futuros
- ✅ Checkbox com blur e opacidade reduzida
- ✅ Contador atualizado: `completedCount/unlockedCount` (não total)

**Renomeação:** "Protocolo de Descompressão" → **"Protocolo de Implementação"**

**currentDay dinâmico:** Calculado a partir de `pos_evento_unlock_date`:
```typescript
const diffDays = Math.floor(
  (now.getTime() - unlockDate.getTime()) / (1000 * 60 * 60 * 24)
)
return Math.max(1, Math.min(7, diffDays + 1))
```

**Arquivos:**
- `src/components/ui/ActionPlan.tsx` - Visual dos 7 dias com lock
- `src/pages/PosEvento.tsx` - currentDay dinâmico

---

#### 4. Relatório Final: Removido Botão PDF

- ✅ Removido botão de download PDF do componente `FinalReport`
- ✅ Removida prop `onDownload` e import `FileDown`
- ✅ Removida prop `onDownload` do uso em `PosEvento.tsx`

**Arquivo:** `src/components/ui/FinalReport.tsx`

---

#### 5. Aulas Bônus Trancadas até 12/02

**Novo:** Seção de aulas bônus no Pré-Evento com trava por data.

- ✅ Badge "Libera 12/02" com ícone Lock
- ✅ Overlay escuro sobre cada card de aula
- ✅ Imagens em grayscale com opacidade reduzida
- ✅ Click desabilitado enquanto `new Date() < aulasReleaseDate`
- ✅ Liberação automática em `2026-02-12T00:00:00-03:00`

**Arquivo:** `src/pages/PreEvento.tsx`

---

#### 6. Mensagem Contextual de Aba Bloqueada

**Antes:** Pré-Evento mostrava "Aba Bloqueada - será liberada automaticamente" mesmo após o evento começar.

**Depois:** Detecta se `pre_evento_lock_date` já passou:

- **Antes do evento:** Mensagem original com Lock icon
- **Após evento iniciar:** "Fase Concluída" com Zap icon, mensagem incentivando ir para próximas abas, botões de navegação para Ao Vivo e/ou Pós-Evento

**Arquivo:** `src/pages/PreEvento.tsx`

---

#### 7. Links de Compra Hotmart com UTMs

**Novo:** Steps de compra (Dossiê e Aulas Editadas) agora abrem checkout Hotmart com UTM tracking.

**Links configurados:**
- **Dossiê do Negócio (PDF):** `https://pay.hotmart.com/X104244085H?off=h8jdxfk4`
- **Aulas Editadas:** `https://pay.hotmart.com/B104245453L?off=h15bzcne`

**UTMs adicionados:**
```
utm_source=appdiagn
utm_medium=app
utm_campaign=imersao2026
utm_content=dossie-pdf | aulas-editadas
```

**Implementação:**
- Constante `PURCHASE_LINKS` com URLs e utm_content
- Função `buildPurchaseUrl()` adiciona UTMs automaticamente
- `handleStepClick` abre URL em nova aba ao clicar em steps de compra

**Arquivo:** `src/pages/PreEvento.tsx`

---

#### 8. Notificações: Suporte a DELETE

**Problema:** Ao deletar notificações pelo Admin, o realtime não atualizava a lista nos clientes.

**Solução:**
- ✅ Subscription mudou de `event: 'INSERT'` para `event: '*'`
- ✅ Handler para `payload.eventType === 'DELETE'` remove notificação do state
- ✅ `deleteAllNotifications` usa `.select('id')` para verificar se rows foram deletadas
- ✅ Retorna erro se 0 rows deletadas (indica RLS policy faltando)

**Arquivo:** `src/hooks/useNotifications.ts`

---

#### 9. LiveEventModal - Redirecionamento Automático

**Novo componente:** Modal que aparece quando o evento está ao vivo, incentivando navegação para aba Ao Vivo.

**Arquivo:** `src/components/ui/LiveEventModal.tsx` (novo)

---

#### 10. Outras Melhorias e Fixes

- ✅ **Dynamic Countdown:** Countdown agora usa datas do `event_state` do banco de dados
- ✅ **Protocol Survey:** Agora exige completar o protocolo antes de dar XP (não basta clicar)
- ✅ **Image Compression:** Upload automático com compressão de imagem
- ✅ **Auth Flow:** Correções no fluxo de criação de conta (handle existing users)
- ✅ **Presence Status:** Melhorias no status de presença e erros de upload de foto
- ✅ **Version Bump:** v1.0.5

---

### 📁 Arquivos Criados/Modificados

**Criados:**
- `src/components/ui/LiveEventModal.tsx` - Modal de evento ao vivo

**Modificados (18 arquivos):**
- `src/pages/Admin.tsx` - Layout 65/35, status dots, filtros, sort
- `src/pages/PreEvento.tsx` - Aulas trancadas, msg contextual, purchase links
- `src/pages/PosEvento.tsx` - currentDay dinâmico, removido onDownload
- `src/pages/AoVivo.tsx` - Melhorias diversas
- `src/components/ui/ActionPlan.tsx` - 7 dias com blur/lock, rename
- `src/components/ui/FinalReport.tsx` - Removido botão PDF
- `src/components/ui/BottomNav.tsx` - Ajustes
- `src/components/ui/Countdown.tsx` - Countdown dinâmico
- `src/components/ui/EventCountdown.tsx` - Ajustes
- `src/components/ui/AIChatInterface.tsx` - Ajustes
- `src/components/ui/index.ts` - Export LiveEventModal
- `src/hooks/useNotifications.ts` - DELETE handler, verificação RLS
- `src/hooks/useEventState.ts` - Ajustes
- `src/hooks/useAIChat.ts` - Ajustes
- `src/lib/supabase.ts` - Ajustes
- `vite.config.ts` - Ajustes

---

### 🐛 Bugs Corrigidos

1. **Status online não aparecia** - Query faltava `last_seen_at`, UI não tinha indicadores
2. **Plano de ação idêntico entre usuários** - Prompt da Edge Function muito prescritivo (identificado, não corrigido)
3. **Notificações não sumiam ao deletar** - Subscription só ouvia INSERT, não DELETE
4. **Countdown estático** - Usava data hardcoded ao invés do event_state
5. **XP dado sem completar survey** - Protocol survey dava XP ao clicar sem verificar conclusão
6. **Msg enganosa pós-evento** - "Aba será liberada" quando evento já começou

---

## [2.3.0] - 2026-02-03: Documentation Reorganization

### 📚 Major Documentation Overhaul

#### Objetivo
Consolidar, hierarquizar e organizar toda documentação do projeto, reduzindo fragmentação e duplicação.

#### Mudanças Implementadas

**1. Documentos Consolidados:**
- ✅ **10-DIAGNOSTIC-SCORE-CALCULATION.md** - Merged 2 docs (CALCULO-SCORE-GARGALO + MELHORIAS-SCORE-GARGALO)
- ✅ **12-AUDIO-SYSTEM.md** - Merged 4 docs (FLUXO_AUDIO + IMPLEMENTACAO + GUIA-SETUP + GHL-WORKFLOW-2)
- ✅ **53-DEPLOYMENT-GUIDE.md** - Merged 3 docs (DEPLOY-SECURITY + DEPLOY-WEBHOOK + DEPLOY-WEBHOOK-HOTMART)
- ✅ **02-CHANGELOG.md** (este arquivo) - Merged 3 changelogs

**2. Estrutura Hierárquica:**
```
00-09: PROJECT OVERVIEW
  01-PROJECT-STATUS.md
  02-CHANGELOG.md
  03-DOCS-INDEX.md

10-19: CORE FEATURES
  10-DIAGNOSTIC-SCORE-CALCULATION.md
  11-TAB-ACCESS-CONTROL.md
  12-AUDIO-SYSTEM.md
  13-CHAT-AI-SYSTEM.md

20-29: INTEGRATIONS
  20-GHL-WORKFLOWS.md
  21-HOTMART-WEBHOOK.md
  22-WHATSAPP-INTEGRATION.md

30-39: ARCHITECTURE & DATABASE
  30-SUPABASE-SCHEMA-REFERENCE.md (transformado de GUIA-MIGRATIONS)
  31-ARCHITECTURE-OVERVIEW.md
  32-SECURITY-VALIDATION.md

50-59: DEVELOPER GUIDES
  50-QUICK-START-NEW-DEVS.md (novo)
  52-TROUBLESHOOTING-GUIDE.md (novo)
  53-DEPLOYMENT-GUIDE.md

ARCHIVE/ (Historical)
  MIGRATIONS-EXECUTED/
  COMPLETED-TASKS/
  OLD-CHANGELOGS/
  OLD-PROMPTS/
```

**3. Backup Criado:**
- `BACKUP_DOCS_2026-02-03/` - 29 arquivos markdown salvos

**4. ARCHIVE/ Criado:**
- Estrutura de 5 subpastas para documentos históricos
- _README.md explicando propósito do arquivo

#### Benefícios
- 📉 35 docs → 29 core + ARCHIVE/
- 🔍 Hierarquia numérica clara
- 🔗 Navegação simplificada
- 📖 Conteúdo consolidado sem duplicação

#### Arquivos Criados/Modificados
- `02-CHANGELOG.md` (este arquivo) - Unified changelog
- `10-DIAGNOSTIC-SCORE-CALCULATION.md` - Consolidated
- `12-AUDIO-SYSTEM.md` - Consolidated (1385 lines)
- `53-DEPLOYMENT-GUIDE.md` - Consolidated (12 sections)
- `BACKUP_DOCS_2026-02-03/` - Backup directory
- `ARCHIVE/` - Archive structure

---

## [2.2.0] - 2026-02-02 (Part B): Admin Improvements

### 🎨 Melhorias na Interface Admin

#### 1. Visão do Participante em Tempo Real

**Antes:**
- Mockup estático desatualizado
- Botão "Abrir Visão Real" para ver em nova aba
- Não refletia mudanças instantaneamente

**Depois:**
- **Iframe com app real** no lado direito do Admin
- Mostra `/ao-vivo` rodando em tempo real
- Qualquer mudança no evento refletida instantaneamente
- Navegação completa (scroll funcional)
- Botão removido (iframe já é a visão real)

**Arquivo:** `src/pages/Admin.tsx` (linhas 2716-2763)

**Benefícios:**
- ✅ Visão precisa do que participantes veem
- ✅ Feedback imediato ao fazer mudanças
- ✅ Não precisa abrir nova aba
- ✅ Interface mais limpa

---

#### 2. Botão "Salvar Links da Oferta"

**Problema:** Mudanças nos links da oferta e parâmetros UTM não eram persistidas.

**Solução:**
- ✅ Novo botão "Salvar Links da Oferta" abaixo dos parâmetros UTM
- ✅ Salvamento no banco via coluna `offer_links` (JSONB)
- ✅ Carregamento automático ao abrir Admin
- ✅ Feedback visual (loading + toast)

**Arquivos:**
- `src/pages/Admin.tsx`:
  - State `savingLinks` (linha 220)
  - Função `handleSaveOfferLinks()` (linhas 682-702)
  - useEffect para carregar links (linhas 413-433)
  - Botão Salvar (linhas 1515-1553)
- `supabase-migrations-offer-links.sql` (novo)

**Migration:**
```sql
ALTER TABLE public.event_state
ADD COLUMN IF NOT EXISTS offer_links JSONB DEFAULT '{}'::jsonb;
```

---

#### 3. Toast do Admin com Auto-Dismiss

**Problema:** Toasts ficavam na tela indefinidamente.

**Solução:**
- ✅ Auto-dismiss após 5 segundos
- ✅ useEffect limpa o toast automaticamente
- ✅ Removido "temporariamente" do texto de desativação da IA

**Arquivo:** `src/pages/Admin.tsx` (linhas 436-444)

---

#### 4. "Marcar Todos como Lido" Otimizado

**Problema:** Updates sequenciais, muito lento com muitas notificações.

**Solução:**
- ✅ Updates em paralelo com `Promise.all()`
- ✅ ~10x mais rápido para 10+ notificações
- ✅ Logs de debug adicionados
- ✅ Validação de erros melhorada

**Arquivo:** `src/hooks/useNotifications.ts` (linhas 146-187)

**Antes:**
```typescript
for (const notif of unreadNotifications) {
  await supabase.from('notifications').update(...)  // Sequencial
}
```

**Depois:**
```typescript
const updatePromises = unreadNotifications.map(notif =>
  supabase.from('notifications').update(...)
)
await Promise.all(updatePromises)  // Paralelo
```

---

## [2.1.0] - 2026-02-02 (Part A): Critical Fixes

### 🔧 Correções Críticas de Sincronização

#### 1. Sincronização de Dia entre Admin e Participante

**Problema:** Quando Admin clicava em "DIA 2", a mudança não refletia na tela do participante em `/ao-vivo`.

**Causa Raiz:**
- `selectedDay` era state local inicializado com `1` hard-coded
- Não havia listener para `eventState.current_day` do banco de dados
- Badge "DIA 1/2" usava `currentDay` (calculado do módulo) ao invés de `selectedDay`

**Solução:**

**Arquivo: `src/pages/AoVivo.tsx`**

```typescript
// ANTES (linha 121)
const [selectedDay, setSelectedDay] = useState<1 | 2>(1)

// DEPOIS
const [selectedDay, setSelectedDay] = useState<1 | 2>(eventState?.current_day || 1)

// useEffect para sincronização (linhas 132-137)
useEffect(() => {
  if (eventState?.current_day && eventState.current_day !== selectedDay) {
    console.log(`🗓️ [AoVivo] Dia mudou no servidor: ${selectedDay} → ${eventState.current_day}`)
    setSelectedDay(eventState.current_day as 1 | 2)
  }
}, [eventState?.current_day])
```

**Badge atualizado (linhas 847-859):**
- Cyan (Dia 1) → Purple (Dia 2)
- Cor condicional baseada em `selectedDay`

**Resultado:**
- ✅ Dia sincroniza em tempo real via Supabase Realtime
- ✅ Badge muda de cor automaticamente
- ✅ Console log para debug

---

#### 2. Sistema de Notificações Restaurado

**Problema:** Notificações pararam completamente. Admin enviava avisos mas nada aparecia no drawer.

**Causa Raiz:**
- Hook `useNotifications` foi **removido acidentalmente**
- Substituído por array vazio: `const [notifications] = useState<Notification[]>([])`
- Sem subscription realtime = sem notificações

**Solução:**

**Arquivo: `src/pages/AoVivo.tsx`**

```typescript
// ANTES (linhas ~159-161) - CÓDIGO QUEBRADO
const [notifications] = useState<Notification[]>([])
const unreadCount = notifications.filter(n => !n.read_by?.includes(user?.id || '')).length

// DEPOIS (linhas 159-164) - HOOK RESTAURADO
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
} = useNotifications()
```

**Resultado:**
- ✅ Notificações aparecem em tempo real
- ✅ Console logs voltaram
- ✅ Unread count funciona
- ✅ Marcar como lida funciona

---

#### 3. Migration: Campo `read_by` na Tabela Notifications

**Problema:** Policy "Users can mark notifications as read" já existia, causando erro.

**Solução:**

**Arquivo: `supabase-migrations-notifications-v3-read-by.sql`**

```sql
-- Adicionar campo read_by (array de UUIDs)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Índice GIN para performance
CREATE INDEX IF NOT EXISTS idx_notifications_read_by
  ON public.notifications USING GIN(read_by);

-- Drop policy antes de criar (evita erro)
DROP POLICY IF EXISTS "Users can mark notifications as read"
  ON public.notifications;

CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

**Resultado:**
- ✅ Migration executa sem erros
- ✅ Índice GIN para queries eficientes
- ✅ Policy permite UPDATE de qualquer usuário

---

#### 4. Botões de Status Mutuamente Exclusivos

**Problema:** Era possível ativar PAUSAR + ALMOÇO + ATIVIDADE simultaneamente.

**Solução:**

**Arquivo: `src/pages/Admin.tsx`**

**Lógica de toggle atualizada:**
- PAUSAR: Muda status para `paused` ou `live`
- ALMOÇO: Muda status para `lunch` ou `live` (abre modal para horário)
- ATIVIDADE: Muda status para `activity` ou `live`

**Botões condicionalmente desabilitados:**
```typescript
<motion.button
  onClick={handleTogglePause}
  disabled={eventState.status === 'lunch' || eventState.status === 'activity'}
  style={{
    opacity: (eventState.status === 'lunch' || eventState.status === 'activity') ? 0.5 : 1,
    cursor: (eventState.status === 'lunch' || eventState.status === 'activity')
      ? 'not-allowed'
      : 'pointer',
  }}
>
  {/* ... */}
</motion.button>
```

**Resultado:**
- ✅ Apenas um status ativo por vez
- ✅ Botões desabilitam quando outro status está ativo
- ✅ Feedback visual (opacity 0.5, cursor not-allowed)

---

#### 5. Modal Customizada para Horário de Almoço

**Problema:** `window.prompt()` era funcional mas "muito grosseiro" esteticamente.

**Solução:**

**Arquivo: `src/pages/Admin.tsx` (linhas 3850-4000)**

**Características:**
- ✅ Backdrop com blur (`backdrop-filter: blur(8px)`)
- ✅ Ícone Coffee em badge circular laranja
- ✅ Input `type="time"` com focus states
- ✅ Animações de entrada/saída (scale + opacity)
- ✅ Click fora fecha modal
- ✅ Botões Cancelar e Confirmar estilizados
- ✅ Horário sugerido pré-preenchido (+1h do horário atual)

**Resultado:**
- ✅ UX profissional e consistente com design system
- ✅ Validação de horário vazio
- ✅ Notificação enviada com horário personalizado

---

#### 6. Debug Logs Adicionados

**Admin.tsx - Mudança de Dia:**
```typescript
console.log('📅 [Admin] Mudando dia:', newDay)
console.log('📅 [Admin] Estado atual:', eventState)
```

**AoVivo.tsx - Sincronização de Dia:**
```typescript
console.log(`🗓️ [AoVivo] Dia mudou no servidor: ${selectedDay} → ${eventState.current_day}`)
```

**Resultado:**
- ✅ Rastreamento de mudanças de dia
- ✅ Debugging facilitado
- ✅ Emojis para identificação rápida

---

### 🐛 Bugs Corrigidos

1. **Day Sync Bug** - Dia não sincronizava entre Admin e AoVivo
2. **Badge Bug** - Badge mostrava dia errado (currentDay vs selectedDay)
3. **Notifications Bug** - Hook removido acidentalmente, sistema parou
4. **Migration Bug** - Policy duplicada causava erro
5. **UX Bug** - window.prompt feio, substituído por modal customizada
6. **Status Bug** - Botões não eram mutuamente exclusivos

---

## [2.0.0] - 2026-02-01: Security + Thank You

### 🚨 CRITICAL - Sistema de Validação de Segurança

**Problema resolvido:** Vulnerabilidade crítica que permitia acesso não autorizado

#### Implementações

**1. Validação de compras em múltiplas camadas:**
- ✅ **Função SQL** `is_valid_buyer()` para validação centralizada
- ✅ **Row Level Security (RLS)** atualizado para bloquear inserções não autorizadas
- ✅ **Campo `manual_approval`** para override administrativo
- ✅ **UI "Acesso Negado"** com botão de suporte
- ✅ **Remoção do botão "Continuar sem verificação"** (bypass de segurança)

**2. Arquivos modificados:**
- `src/pages/ThankYou.tsx` - Validação completa integrada
- `supabase-validation-function.sql` (novo)
- `fix-survey-responses-rls-v2.sql` (novo)
- `supabase-migrations-purchases-v3.sql` (novo)

**3. Documentação:**
- [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md) - Documentação técnica completa
- [DEPLOY-SECURITY.md](./DEPLOY-SECURITY.md) - Guia rápido de deploy

**4. Validações implementadas:**
- ✅ `status = 'approved'` OU `manual_approval = true`
- ✅ `refunded_at IS NULL` (compras reembolsadas bloqueadas)
- ✅ `product_slug = 'imersao-diagnostico-vendas'` (produto correto)

---

### ✨ Reorganização do Fluxo Thank You Page

**Nova sequência:** Survey → Password → WhatsApp

#### Mudanças principais

**1. Passo 1: PESQUISA DE CALIBRAGEM**
- 8 questões do Protocolo de Iniciação
- Sliders de 1-10
- +30 XP ao completar

**2. Passo 2: CRIAR SENHA**
- Validação forte (8+ caracteres, maiúscula, número)
- Confirmação de senha
- Cria conta automaticamente

**3. Passo 3: GRUPO WHATSAPP**
- Indicadores visuais "Passo 1 de 2" e "Passo 2 de 2"
- CTA claro para entrar no grupo
- Auto-login após criar senha

#### Arquivos modificados
- `src/pages/ThankYou.tsx` - Fluxo completo reorganizado
- `src/data/survey-config.ts` - Centralização da pesquisa

#### Melhorias UX
- ✅ Passos numerados e alinhados visualmente
- ✅ Mensagens personalizadas com nome do comprador
- ✅ Feedback visual de progresso
- ✅ Validações em tempo real

---

## [1.5.0] - 2026-01-31: XP System Redesigned

### 🎮 Nova Distribuição: 1000 XP Total

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

#### Arquivos criados/modificados
- `src/config/xp-system.ts` (novo) - Configuração centralizada
- `src/pages/PreEvento.tsx` - Integração com novo sistema
- `src/pages/AoVivo.tsx` - Checkins com 20 XP
- `src/pages/PosEvento.tsx` - Plano 7 dias
- `src/components/ui/ProfileCard.tsx` - Display de nível e XP

#### Sistema de Níveis

```
0-99 XP    → Novato
100-199 XP → Iniciante
200-399 XP → Iniciante+
400-599 XP → Intermediário
600-999 XP → Avançado
1000 XP    → Mestre IMPACT
```

---

## [1.4.0] - 2026-01-31: Webhook Hotmart

### 📦 Integração Hotmart

#### Webhook Hotmart

**Implementação:**
- ✅ Edge Function `/hotmart-webhook` criada
- ✅ Processar eventos: `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CANCELED`
- ✅ Auto-criação de usuário se não existir
- ✅ Formatação de nome (apenas primeiro nome em Title Case)
- ✅ Validação de signature Hotmart

**Arquivos:**
- `supabase/functions/hotmart-webhook/index.ts`
- `supabase-migrations-purchases-v2.sql` - Campos adicionais (buyer_name, buyer_document, buyer_phone, full_price)

**Documentação:**
- [DEPLOY-WEBHOOK.md](./DEPLOY-WEBHOOK.md)
- [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md)

---

### Google Sheets Integration (🔄 Pendente)

**Objetivo:** Sincronizar dados de participantes em planilha administrativa

**Colunas planejadas:**
- Dados básicos: Email, Nome, Telefone, Empresa, Cargo
- Progresso: XP Total, Nível, Módulos Confirmados, Plano 7 Dias
- Compras: PDF, Aulas, IMPACT (transaction IDs)
- Feedback: NPS Dia 1, NPS Final
- Protocolo: 8 respostas de calibragem
- Timestamps: Data Inscrição, Última Atividade

**Status: Planejado (não implementado)**
- [ ] Setup Google Cloud Service Account
- [ ] Edge Function `/sync-google-sheets`
- [ ] Cron Job (10 min)

---

## [1.3.0] - 2026-01-30: Admin + Supabase Integration

### 🎯 Admin Dashboard

#### Melhorias
- ✅ Substituído mocks por dados reais do Supabase
- ✅ Fetch automático a cada 30 segundos
- ✅ Ordenação por XP (maior primeiro)
- ✅ Exibição de atividade real dos usuários

**Arquivos:**
- `src/pages/Admin.tsx` - Queries reais do Supabase

---

### Integração Supabase Completa

#### Database
- ✅ Tabelas: `profiles`, `purchases`, `survey_responses`, `nps_responses`, `whatsapp_messages`
- ✅ Real-time habilitado para `profiles`
- ✅ RLS (Row Level Security) configurado
- ✅ Triggers automáticos para criar profile após signup

#### Auth
- ✅ Sign up / Login
- ✅ Context global (`AuthContext`)
- ✅ Subscription real-time de perfil

**Arquivos:**
- `src/lib/supabase.ts` - Cliente Supabase
- `src/contexts/AuthContext.tsx` - Context de autenticação
- `src/hooks/useUserProgress.ts` - Hook de progresso

---

## [1.2.0] - 2026-01-29: Design System + Radar Chart

### 🎨 Design System

#### Theme tokens

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

#### Componentes UI

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

**Documentação:**
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)

---

## [1.1.0] - 2026-01-28: Modules + Survey

### 📊 Dados do Evento

#### 17 Módulos (Dia 1 + Dia 2)

- ✅ Módulo 0: INÍCIO DO DIAGNÓSTICO
- ✅ Módulos 1-8: Dia 1 (FRICÇÃO, PERCEPÇÃO, ARQUITETURA, etc.)
- ✅ Módulos 9-16: Dia 2 (RETOMADA, PROFUNDIDADE, SIMULAÇÃO, etc.)

**Arquivos:**
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

**Características:**
- ✅ Sliders de 1-10
- ✅ Labels contextuais (Esquerda: problema, Direita: solução)
- ✅ Orientações claras
- ✅ Salvo no Supabase (`survey_responses`)

---

## [1.0.0] - 2026-01-27: Initial MVP

### 🚀 Estrutura Base

#### Rotas criadas

- `/login` - Login
- `/pre-evento` - Pré-Evento
- `/ao-vivo` - Ao Vivo
- `/pos-evento` - Pós-Evento
- `/admin` - Admin
- `/obrigado` - Thank You
- `/demo` - Demo
- `/dev` - DevNav

#### Stack

- ⚛️ React + Vite
- 📘 TypeScript
- 🎨 Framer Motion
- 🎯 Lucide Icons
- ☁️ Vercel (deploy)
- 🗄️ Supabase (backend)

---

## 📁 ESTRUTURA DO PROJETO

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
│       ├── hotmart-webhook/ # Edge Function webhook
│       └── generate-audio/  # Edge Function áudio personalizado
├── *.sql                    # Migrations SQL
├── *.md                     # Documentação
└── package.json
```

---

## 🗄️ BANCO DE DADOS (Supabase)

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
- manual_approval (boolean, default false)
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

#### `event_state`

```sql
- id (uuid, PK)
- status (text: 'offline', 'live', 'paused', 'finished', 'lunch', 'activity')
- current_day (integer: 1 or 2)
- current_module (integer: 0-17)
- offer_unlocked (boolean)
- offer_visible (boolean)
- ai_enabled (boolean)
- offer_links (jsonb)
- pre_evento_enabled, pre_evento_unlock_date, pre_evento_lock_date
- ao_vivo_enabled, ao_vivo_unlock_date, ao_vivo_lock_date
- pos_evento_enabled, pos_evento_unlock_date, pos_evento_lock_date
- updated_at, updated_by
```

#### `notifications`

```sql
- id (uuid, PK)
- type (text: 'info', 'warning', 'success', 'danger')
- title (text)
- message (text)
- read_by (uuid[])
- created_at
```

#### `survey_audio_files`

```sql
- id (uuid, PK)
- survey_response_id (uuid, FK → survey_responses, unique)
- user_id (uuid, FK → profiles)
- email (text)
- script_generated (text)
- audio_url (text)
- audio_duration_seconds (integer)
- elevenlabs_voice_id (text)
- openai_model (text, default 'o1-mini')
- status (text: 'pending', 'processing', 'completed', 'failed')
- created_at
```

### Funções SQL

#### `is_valid_buyer()`

```sql
-- Valida se email/transaction pertence a comprador válido
-- Retorna: is_valid, purchase_id, user_id, buyer_name, reason
```

### RLS Policies

- ✅ `profiles` - Usuários só veem próprio perfil
- ✅ `purchases` - Usuários só veem próprias compras
- ✅ `survey_responses` - Validação estrita por compra
- ✅ `nps_responses` - Usuários só inserem próprias respostas
- ✅ `event_state` - Todos leem, apenas admins escrevem
- ✅ `notifications` - Todos leem, qualquer um pode marcar como lida

---

## 🚀 DEPLOY

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
4. supabase-migrations-event-state-v2.sql
5. supabase/migrations/20260203000004_tab_access_control.sql
6. supabase-migrations-offer-links.sql
7. supabase-migrations-survey-audio-files.sql
8. supabase-migrations-notifications-v3-read-by.sql
```

**Edge Functions:**
```bash
supabase functions deploy hotmart-webhook
supabase functions deploy generate-audio
supabase functions deploy generate-action-plan
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

### Core Features (10-19)
- [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md) - Sistema de score e gargalo
- [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md) - Controle de acesso às abas
- [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md) - Sistema de áudio personalizado

### Integrations (20-29)
- [20-GHL-WORKFLOWS.md](./20-GHL-WORKFLOWS.md) - Workflows do Go High Level
- [21-HOTMART-WEBHOOK.md](./21-HOTMART-WEBHOOK.md) - Integração Hotmart

### Architecture (30-39)
- [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md) - Referência do schema
- [32-SECURITY-VALIDATION.md](./32-SECURITY-VALIDATION.md) - Sistema de segurança

### Design (40-49)
- [40-DESIGN-SYSTEM.md](./40-DESIGN-SYSTEM.md) - Sistema de design

### Developer Guides (50-59)
- [50-QUICK-START-NEW-DEVS.md](./50-QUICK-START-NEW-DEVS.md) - Onboarding rápido
- [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md) - Solução de problemas
- [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md) - Guia de deployment

---

## 🎯 STATUS DAS FEATURES

### ✅ Implementado (Produção)
- [x] Sistema de autenticação (Supabase Auth)
- [x] Thank You Page com validação de compras
- [x] Sistema de XP redesenhado (1000 XP)
- [x] Pré-Evento com gamification
- [x] Ao Vivo com checkins de módulos
- [x] Pós-Evento com Plano 7 Dias (IA + fallback)
- [x] Webhook Hotmart
- [x] Admin Dashboard com dados reais
- [x] RLS completo e seguro
- [x] Pesquisa de calibragem (8 questões)
- [x] Real-time updates via Supabase
- [x] Sistema de notificações (com DELETE handler)
- [x] Sincronização de dia Admin-Participante
- [x] Controle de acesso às abas (unlock/lock dates)
- [x] Sistema de áudio personalizado (Edge Function + ElevenLabs)
- [x] Sistema de presença em tempo real (heartbeat 30s)
- [x] Admin: indicadores online/idle/offline + filtros + sort
- [x] Links de compra Hotmart com UTM tracking
- [x] Plano 7 dias com blur/lock em dias futuros
- [x] Aulas bônus com trava por data (12/02)
- [x] LiveEventModal - redirecionamento automático ao vivo
- [x] Countdown dinâmico baseado em event_state
- [x] Compressão automática de imagens no upload
- [x] Documentação reorganizada e hierarquizada

### 🔄 Em Progresso
- [ ] Google Sheets Integration
- [ ] Personalização real do plano de ação IA (prompt menos prescritivo)
- [ ] RLS policy DELETE para notifications (pode falhar ao limpar avisos)

### 📋 Planejado
- [ ] Admin - seção "Inscritos IMPACT"
- [ ] Badges/Achievements visuais
- [ ] Push notifications (optional)
- [ ] Analytics dashboard

---

## 🐛 ISSUES CONHECIDOS

### Resolvidos ✅
- [x] ~~Profile modal não salvava dados~~ → RESOLVIDO (handleSaveProfile)
- [x] ~~XP não persistia no banco~~ → RESOLVIDO (useUserProgress hook)
- [x] ~~Botão "Continuar sem verificação" permitia bypass~~ → RESOLVIDO (removido)
- [x] ~~RLS permitia inserções anônimas~~ → RESOLVIDO (policy atualizada)
- [x] ~~Dia não sincronizava entre Admin e AoVivo~~ → RESOLVIDO (useEffect + eventState)
- [x] ~~Notificações pararam de funcionar~~ → RESOLVIDO (hook restaurado)
- [x] ~~Botões de status não eram exclusivos~~ → RESOLVIDO (disabled condicional)
- [x] ~~window.prompt feio~~ → RESOLVIDO (modal customizada)

### Abertos 🔄
- [ ] Google Sheets sync não implementado
- [ ] Manual approval UI no Admin (planejado)
- [ ] Plano de ação IA gera planos muito similares entre usuários (prompt prescritivo)
- [ ] RLS policy DELETE na tabela notifications pode estar faltando
- [ ] Testes end-to-end de compra → XP → Google Sheets

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar documentação específica do módulo
2. Checar logs do Supabase
3. Consultar [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)
4. Escalar para dev team

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard:** https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Hotmart:** Painel de webhooks
- **Produção:** https://app-diagnostico-vendas.vercel.app

---

**Última revisão:** 2026-02-04
**Versão atual:** 2.4.0
**Próxima milestone:** Evento 28/02 - Validação final + Google Sheets

---

**Desenvolvido por:** Claude Code + Andre Buric
**Repositório:** [GitHub](https://github.com/...)

---

**FIM DO CHANGELOG**
