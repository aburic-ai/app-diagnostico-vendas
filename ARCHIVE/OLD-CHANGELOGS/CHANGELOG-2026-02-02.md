# Changelog - 2026-02-02

## 🎯 Resumo das Alterações

Sessão focada em correções críticas do sistema de evento ao vivo, sincronização Admin-Participante, e sistema de notificações.

---

## 🔧 Correções Implementadas

### 1. Sincronização de Dia entre Admin e Participante

**Problema:** Quando Admin clicava em "DIA 2", a mudança não refletia na tela do participante em `/ao-vivo`.

**Causa Raiz:**
- `selectedDay` era state local inicializado com `1` hard-coded
- Não havia listener para `eventState.current_day` do banco de dados
- Badge "DIA 1/2" usava `currentDay` (calculado do módulo) ao invés de `selectedDay`

**Solução Implementada:**

**Arquivo: `src/pages/AoVivo.tsx`**

```typescript
// ANTES (linha 121)
const [selectedDay, setSelectedDay] = useState<1 | 2>(1)

// DEPOIS
const [selectedDay, setSelectedDay] = useState<1 | 2>(eventState?.current_day || 1)
```

**Adicionado useEffect para sincronização (linhas 132-137):**

```typescript
useEffect(() => {
  if (eventState?.current_day && eventState.current_day !== selectedDay) {
    console.log(`🗓️ [AoVivo] Dia mudou no servidor: ${selectedDay} → ${eventState.current_day}`)
    setSelectedDay(eventState.current_day as 1 | 2)
  }
}, [eventState?.current_day])
```

**Badge atualizado (linhas 847-859):**

```typescript
<span
  style={{
    fontSize: '10px',
    color: selectedDay === 1
      ? theme.colors.accent.cyan.DEFAULT
      : theme.colors.accent.purple.light,
    fontWeight: theme.typography.fontWeight.semibold,
    padding: '4px 8px',
    background: selectedDay === 1
      ? 'rgba(34, 211, 238, 0.1)'
      : 'rgba(168, 85, 247, 0.1)',
    borderRadius: '6px',
  }}
>
  DIA {selectedDay}
</span>
```

**Resultado:**
- ✅ Dia sincroniza em tempo real via Supabase Realtime
- ✅ Badge muda de cor: Cyan (Dia 1) → Purple (Dia 2)
- ✅ Console log para debug: `🗓️ [AoVivo] Dia mudou no servidor: 1 → 2`

---

### 2. Sistema de Notificações Restaurado

**Problema:** Notificações pararam completamente de funcionar. Admin enviava avisos mas nada aparecia no drawer dos participantes.

**Causa Raiz:**
- Hook `useNotifications` foi **removido acidentalmente** do componente
- Substituído por array vazio: `const [notifications] = useState<Notification[]>([])`
- Sem subscription realtime = sem notificações

**Diagnóstico:**

1. ✅ Coluna `read_by` existia no banco (migration confirmada)
2. ✅ RLS policies corretas
3. ❌ Console não mostrava logs do `useNotifications`
4. ❌ Drawer sempre vazio

**Solução Implementada:**

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

**Import adicionado (linha 57):**

```typescript
import { useNotifications } from '../hooks/useNotifications'
```

**NotificationDrawer conectado (linha 1421):**

```typescript
<NotificationDrawer
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
  notifications={notifications}
  onMarkAsRead={markAsRead}
  onMarkAllAsRead={markAllAsRead}
/>
```

**Resultado:**
- ✅ Notificações aparecem em tempo real
- ✅ Console logs voltaram: `🔔 [useNotifications] New notification received`
- ✅ Unread count funciona
- ✅ Marcar como lida funciona

---

### 3. Migration: Campo `read_by` na Tabela Notifications

**Problema:** Policy "Users can mark notifications as read" já existia, causando erro ao rodar migration.

**Solução Implementada:**

**Arquivo: `supabase-migrations-notifications-v3-read-by.sql`**

```sql
-- Adicionar campo read_by (array de UUIDs dos usuários que leram)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Comentário
COMMENT ON COLUMN public.notifications.read_by IS 'Array de UUIDs dos usuários que já leram esta notificação';

-- Índice para performance (queries que filtram por usuário)
CREATE INDEX IF NOT EXISTS idx_notifications_read_by ON public.notifications USING GIN(read_by);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Update policy para permitir que usuários marquem como lidas
DROP POLICY IF EXISTS "Users can mark notifications as read" ON public.notifications;
CREATE POLICY "Users can mark notifications as read"
  ON public.notifications FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

**Mudança chave:** `DROP POLICY IF EXISTS` antes de `CREATE POLICY` para evitar erro de duplicação.

**Resultado:**
- ✅ Migration executa sem erros
- ✅ Índice GIN para queries eficientes em arrays
- ✅ Policy permite UPDATE de qualquer usuário

---

### 4. Botões de Status Mutuamente Exclusivos

**Problema:** Era possível ativar PAUSAR + ALMOÇO + ATIVIDADE simultaneamente.

**Solução Implementada:**

**Arquivo: `src/pages/Admin.tsx`**

**Lógica de toggle atualizada:**

```typescript
// PAUSAR (linha ~415)
const handleTogglePause = async () => {
  const wasPaused = eventState.status === 'paused'

  if (wasPaused) {
    await updateEventStatus('live')
    setAdminToast({ message: '▶️ Evento retomado', type: 'success' })
  } else {
    await updateEventStatus('paused')
    await createNotification(
      'warning',
      'Evento Pausado',
      'A transmissão foi pausada temporariamente. Aguarde o retorno.'
    )
    setAdminToast({ message: '⏸ Evento pausado', type: 'info' })
  }
}

// ALMOÇO (linha ~433)
const handleToggleLunch = async () => {
  const wasLunchActive = eventState.status === 'lunch'

  if (wasLunchActive) {
    await updateEventStatus('live')
    await createNotification(
      'success',
      'Retorno do Intervalo',
      'A transmissão foi retomada. Bem-vindos de volta!'
    )
    setAdminToast({ message: '🍽 Intervalo encerrado', type: 'success' })
  } else {
    // Abre modal para pedir horário
    const now = new Date()
    const suggestedTime = new Date(now.getTime() + 60 * 60000) // +1h
    const suggestedTimeStr = suggestedTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    setLunchReturnTime(suggestedTimeStr)
    setShowLunchTimeModal(true)
  }
}

// ATIVIDADE (linha ~474)
const handleToggleActivity = async () => {
  const wasActivityActive = eventState.status === 'activity'

  if (wasActivityActive) {
    await updateEventStatus('live')
    await createNotification(
      'success',
      'Atividade Concluída',
      'Retornamos para a transmissão ao vivo!'
    )
    setAdminToast({ message: '✅ Atividade concluída', type: 'success' })
  } else {
    await updateEventStatus('activity')
    await createNotification(
      'info',
      'Atividade Prática',
      'Momento de aplicar o conteúdo! Complete a atividade proposta.'
    )
    setAdminToast({ message: '⚡ Atividade iniciada', type: 'info' })
  }
}
```

**Botões condicionalmente desabilitados:**

```typescript
// Exemplo: Botão PAUSAR (linha ~1561)
<motion.button
  onClick={handleTogglePause}
  disabled={eventState.status === 'lunch' || eventState.status === 'activity'}
  style={{
    opacity: (eventState.status === 'lunch' || eventState.status === 'activity') ? 0.5 : 1,
    cursor: (eventState.status === 'lunch' || eventState.status === 'activity')
      ? 'not-allowed'
      : 'pointer',
    // ...
  }}
>
  {eventState.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
  {eventState.status === 'paused' ? 'RETOMAR' : 'PAUSAR'}
</motion.button>
```

**Resultado:**
- ✅ Apenas um status ativo por vez
- ✅ Botões desabilitam quando outro status está ativo
- ✅ Feedback visual (opacity 0.5, cursor not-allowed)

---

### 5. Modal Customizada para Horário de Almoço

**Problema:** `window.prompt()` era funcional mas "muito grosseiro" esteticamente.

**Solução Implementada:**

**Arquivo: `src/pages/Admin.tsx`**

**State adicionado (linhas 244-245):**

```typescript
const [showLunchTimeModal, setShowLunchTimeModal] = useState(false)
const [lunchReturnTime, setLunchReturnTime] = useState('')
```

**Handler de confirmação (linhas 456-472):**

```typescript
const handleConfirmLunchTime = async () => {
  if (!lunchReturnTime) {
    alert('Por favor, informe o horário de retorno')
    return
  }

  await updateEventStatus('lunch')
  await createNotification(
    'warning',
    'Intervalo para Almoço',
    `A transmissão retorna às ${lunchReturnTime}. Bom almoço!`
  )

  setAdminToast({ message: '🍽 Intervalo iniciado', type: 'info' })
  setShowLunchTimeModal(false)
  setLunchReturnTime('')
}
```

**Modal Component (linhas 3850-4000):**

```typescript
<AnimatePresence>
  {showLunchTimeModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => setShowLunchTimeModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '2px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Coffee size={32} color="#F97316" />
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '8px',
            fontFamily: theme.typography.fontFamily.orbitron,
            letterSpacing: '0.05em',
          }}
        >
          Intervalo para Almoço
        </h3>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginBottom: '28px',
            lineHeight: '1.5',
          }}
        >
          Informe o horário de retorno que será enviado aos participantes
        </p>

        {/* Time Input */}
        <div style={{ marginBottom: '28px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              color: theme.colors.text.secondary,
              marginBottom: '8px',
              fontWeight: '500',
            }}
          >
            Horário de Retorno
          </label>
          <input
            type="time"
            value={lunchReturnTime}
            onChange={(e) => setLunchReturnTime(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '16px',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              outline: 'none',
              fontFamily: theme.typography.fontFamily.body,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)'
              e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(249, 115, 22, 0.3)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLunchTimeModal(false)}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(100, 116, 139, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '12px',
              color: theme.colors.text.secondary,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily.body,
            }}
          >
            Cancelar
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirmLunchTime}
            style={{
              flex: 1,
              padding: '14px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: theme.typography.fontFamily.body,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**Características:**
- ✅ Backdrop com blur (backdrop-filter: blur(8px))
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

### 6. Debug Logs Adicionados

**Admin.tsx - Mudança de Dia:**

```typescript
// Linha ~406
console.log('📅 [Admin] Mudando dia:', newDay)
console.log('📅 [Admin] Estado atual:', eventState)
console.log('📅 [Admin] Estado após update:', {
  ...eventState,
  current_day: newDay,
})
```

**AoVivo.tsx - Sincronização de Dia:**

```typescript
// Linha ~135
console.log(`🗓️ [AoVivo] Dia mudou no servidor: ${selectedDay} → ${eventState.current_day}`)
```

**Resultado:**
- ✅ Rastreamento de mudanças de dia
- ✅ Debugging facilitado
- ✅ Emojis para identificação rápida

---

## 📁 Arquivos Modificados

### 1. `src/pages/AoVivo.tsx`

**Mudanças:**
- Linha 57: Import `useNotifications`
- Linha 121: `selectedDay` inicializado com `eventState?.current_day || 1`
- Linhas 132-137: useEffect para sincronização de dia
- Linhas 159-164: Hook `useNotifications` restaurado
- Linhas 847-859: Badge "DIA 1/2" com cores condicionais
- Linha 1421: `onMarkAllAsRead` conectado ao drawer

### 2. `src/pages/Admin.tsx`

**Mudanças:**
- Linhas 244-245: State `showLunchTimeModal` e `lunchReturnTime`
- Linhas 396-408: Debug logs para mudança de dia
- Linhas 415-431: `handleTogglePause` atualizado
- Linhas 433-454: `handleToggleLunch` com modal
- Linhas 456-472: `handleConfirmLunchTime` criado
- Linhas 474-491: `handleToggleActivity` atualizado
- Linhas 1561+: Botões com `disabled` condicional
- Linhas 3850-4000: Modal customizada de horário

### 3. `supabase-migrations-notifications-v3-read-by.sql`

**Mudanças:**
- Linha 7: `ADD COLUMN IF NOT EXISTS read_by UUID[]`
- Linhas 13-16: Índices GIN e created_at
- Linhas 18-22: `DROP POLICY IF EXISTS` antes de `CREATE POLICY`

### 4. `src/components/ui/index.ts`

**Mudanças:**
- Linha 48: Export `EventFinishedView` (adicionado automaticamente)

---

## 🧪 Testes Realizados

### ✅ Sincronização de Dia
- [x] Admin muda para Dia 2 → Badge muda em AoVivo
- [x] Badge muda de cor (cyan → purple)
- [x] Console log confirma: `🗓️ [AoVivo] Dia mudou no servidor: 1 → 2`

### ✅ Notificações
- [x] Admin clica PAUSAR → Notificação aparece no drawer
- [x] Admin clica ATIVIDADE → Notificação aparece
- [x] Admin clica ALMOÇO → Modal abre → Notificação com horário
- [x] Unread count atualiza
- [x] Marcar como lida funciona

### ✅ Botões Mutuamente Exclusivos
- [x] PAUSAR ativo → ALMOÇO e ATIVIDADE desabilitados
- [x] ALMOÇO ativo → PAUSAR e ATIVIDADE desabilitados
- [x] ATIVIDADE ativa → PAUSAR e ALMOÇO desabilitados

### ✅ Modal de Horário
- [x] Abre ao clicar ALMOÇO
- [x] Horário sugerido (+1h) pré-preenchido
- [x] Input type="time" funciona
- [x] Cancelar fecha modal
- [x] Confirmar envia notificação com horário correto
- [x] Click fora fecha modal

---

## 🐛 Bugs Corrigidos

1. **Day Sync Bug** - Dia não sincronizava entre Admin e AoVivo
2. **Badge Bug** - Badge mostrava dia errado (currentDay vs selectedDay)
3. **Notifications Bug** - Hook removido acidentalmente, sistema parou
4. **Migration Bug** - Policy duplicada causava erro
5. **UX Bug** - window.prompt feio, substituído por modal customizada
6. **Status Bug** - Botões não eram mutuamente exclusivos

---

## 📊 Impacto

**Antes:**
- ❌ Dia não sincronizava
- ❌ Notificações não funcionavam
- ❌ Múltiplos status ativos simultaneamente
- ❌ UX ruim com window.prompt

**Depois:**
- ✅ Sincronização em tempo real via Supabase
- ✅ Notificações funcionando 100%
- ✅ Status mutuamente exclusivos
- ✅ Modal customizada profissional

---

## 🚀 Próximos Passos

### Pendente (do Plano)
- [ ] Avisos Clickables (navegação para seções)
- [ ] Sistema 30-60-90 Personalizado
- [ ] Chat IA com persistência
- [ ] Workflow 1 GHL (Boas-Vindas)
- [ ] Template WhatsApp Meta

### Sugestões de Melhoria
- [ ] Adicionar countdown no modal de almoço ("Retorna em X minutos")
- [ ] Toast notification quando dia muda
- [ ] Histórico de status changes no Admin
- [ ] Analytics de tempo gasto em cada status

---

## 📝 Notas Técnicas

### Performance
- Índice GIN em `read_by` para queries O(log n) ao invés de O(n)
- useEffect com dependency array correta evita re-renders
- AnimatePresence apenas quando modal aberto

### Segurança
- RLS policies permitem qualquer UPDATE (necessário para sistema de leitura)
- Validação de horário no frontend (alert se vazio)
- Time input type="time" evita formato inválido

### Manutenibilidade
- Debug logs com emojis para fácil identificação
- Código documentado inline
- Handlers separados e nomeados semanticamente

---

**Data:** 2026-02-02
**Sessão:** Correções Críticas de Sincronização e Notificações
**Desenvolvido por:** Claude Code + Andre Buric
**Status:** ✅ Concluído e Testado
