# Guia Técnico - Sincronização de Evento

## 📡 Como Funciona a Sincronização Admin ↔ Participante

### Arquitetura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Admin     │ ──────> │  Supabase    │ ──────> │ Participante│
│  (Update)   │  HTTP   │  event_state │ Realtime│   (Listen)  │
└─────────────┘         └──────────────┘         └─────────────┘
```

### Fluxo de Dados

1. **Admin atualiza estado:**
   ```typescript
   await updateEventStatus('paused')
   await updateCurrentDay(2)
   ```

2. **Supabase grava no banco:**
   ```sql
   UPDATE event_state
   SET status = 'paused', current_day = 2
   WHERE id = 1;
   ```

3. **Realtime notifica clientes:**
   ```typescript
   supabase
     .channel('event_state_changes')
     .on('postgres_changes', { event: 'UPDATE' }, (payload) => {
       setEventState(payload.new)
     })
   ```

4. **UI atualiza automaticamente:**
   ```typescript
   useEffect(() => {
     setSelectedDay(eventState.current_day)
   }, [eventState.current_day])
   ```

---

## 🎛️ Estados do Evento

### Enum EventStatus

```typescript
type EventStatus = 'offline' | 'live' | 'paused' | 'activity' | 'lunch' | 'finished'
```

### Estado Completo

```typescript
interface EventState {
  status: EventStatus
  current_day: 1 | 2
  current_module: number
  event_scheduled_start?: string
}
```

### Tabela: `event_state`

| Campo                  | Tipo        | Descrição                     |
|------------------------|-------------|-------------------------------|
| `id`                   | INTEGER     | PK (sempre 1 - singleton)     |
| `status`               | TEXT        | offline/live/paused/etc       |
| `current_day`          | INTEGER     | 1 ou 2                        |
| `current_module`       | INTEGER     | 0-7                           |
| `event_scheduled_start`| TIMESTAMPTZ | Data agendada do evento       |
| `updated_at`           | TIMESTAMPTZ | Timestamp da última mudança   |

---

## 🔔 Sistema de Notificações

### Tabela: `notifications`

| Campo           | Tipo      | Descrição                          |
|-----------------|-----------|------------------------------------|
| `id`            | UUID      | PK                                 |
| `type`          | TEXT      | info/success/warning/error         |
| `title`         | TEXT      | Título do aviso                    |
| `message`       | TEXT      | Conteúdo do aviso                  |
| `created_at`    | TIMESTAMPTZ | Data de criação                  |
| `read_by`       | UUID[]    | Array de user IDs que leram        |
| `action_type`   | TEXT      | internal/external/none (futuro)    |
| `target_page`   | TEXT      | Página alvo (futuro)               |
| `target_section`| TEXT      | Seção alvo (futuro)                |
| `external_url`  | TEXT      | URL externa (futuro)               |

### Índices Importantes

```sql
-- Performance para queries em arrays
CREATE INDEX idx_notifications_read_by ON notifications USING GIN(read_by);

-- Ordenação por data
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### Hook: `useNotifications`

```typescript
const {
  notifications,        // Notification[]
  unreadCount,         // number
  loading,             // boolean
  error,               // Error | null
  markAsRead,          // (id: string) => Promise<void>
  markAllAsRead,       // () => Promise<void>
  createNotification,  // (type, title, message) => Promise<void>
  isRead,              // (id: string) => boolean
  getUnreadNotifications, // () => Notification[]
  refresh,             // () => Promise<void>
} = useNotifications()
```

**Realtime Subscription:**
```typescript
supabase
  .channel('notifications_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    // Nova notificação → atualiza lista
  })
  .subscribe()
```

---

## 🎨 Componentes Principais

### Admin.tsx

**Responsabilidades:**
- Controlar estado do evento
- Enviar notificações
- Trocar dia/módulo
- Mockup de visualização

**Estados Locais:**
```typescript
const [eventState, setEventState] = useState<EventState>()
const [showLunchTimeModal, setShowLunchTimeModal] = useState(false)
const [lunchReturnTime, setLunchReturnTime] = useState('')
```

**Handlers:**
- `handleChangeDay(day: 1 | 2)` - Muda dia
- `handleTogglePause()` - Pausa/retoma
- `handleToggleLunch()` - Almoço com modal de horário
- `handleToggleActivity()` - Atividade prática

### AoVivo.tsx

**Responsabilidades:**
- Exibir módulo atual
- Sincronizar com Admin
- Mostrar notificações
- Chat IA

**Estados Sincronizados:**
```typescript
const { eventState } = useEventState() // Realtime
const [selectedDay, setSelectedDay] = useState(eventState?.current_day || 1)

useEffect(() => {
  if (eventState?.current_day !== selectedDay) {
    setSelectedDay(eventState.current_day)
  }
}, [eventState?.current_day])
```

**Badge de Dia:**
```typescript
<span style={{
  color: selectedDay === 1
    ? theme.colors.accent.cyan.DEFAULT
    : theme.colors.accent.purple.light,
  background: selectedDay === 1
    ? 'rgba(34, 211, 238, 0.1)'
    : 'rgba(168, 85, 247, 0.1)',
}}>
  DIA {selectedDay}
</span>
```

---

## 🛠️ Troubleshooting

### Dia não sincroniza

**Sintomas:**
- Admin muda para Dia 2
- AoVivo continua mostrando Dia 1

**Debug:**
```typescript
// Admin.tsx
console.log('📅 [Admin] Mudando dia:', newDay)

// AoVivo.tsx
console.log('🗓️ [AoVivo] Dia mudou:', eventState.current_day)
```

**Checklist:**
1. [ ] `useEventState()` está importado e chamado?
2. [ ] `useEffect` com dependency `[eventState?.current_day]` existe?
3. [ ] Badge usa `selectedDay` e não `currentDay`?
4. [ ] Supabase Realtime está conectado? (ver console)

### Notificações não aparecem

**Sintomas:**
- Admin envia notificação
- Drawer do participante vazio

**Debug:**
```typescript
// Verificar se hook está importado
import { useNotifications } from '../hooks/useNotifications'

// Verificar se está sendo usado
const { notifications, unreadCount } = useNotifications()

// Ver logs no console
🔔 [useNotifications] Setting up realtime subscription
🔔 [useNotifications] New notification received
```

**Checklist:**
1. [ ] `useNotifications()` está sendo chamado?
2. [ ] Migration `read_by` foi executada?
3. [ ] RLS policies estão corretas?
4. [ ] Console mostra subscription "SUBSCRIBED"?
5. [ ] Não está usando array vazio fake?

### Modal de almoço não abre

**Sintomas:**
- Clicar ALMOÇO não mostra modal

**Checklist:**
1. [ ] `showLunchTimeModal` state existe?
2. [ ] `handleToggleLunch` seta `setShowLunchTimeModal(true)`?
3. [ ] `AnimatePresence` está importado?
4. [ ] Modal está dentro do return do componente?

### Múltiplos status ativos

**Sintomas:**
- PAUSAR + ALMOÇO ativos ao mesmo tempo

**Solução:**
```typescript
// Botões devem ter disabled condicional
<button
  disabled={eventState.status === 'lunch' || eventState.status === 'activity'}
  onClick={handleTogglePause}
>
  PAUSAR
</button>
```

---

## 🔍 Console Logs Úteis

### Event State Tracking

```typescript
// Admin.tsx
console.log('📅 [Admin] Mudando dia:', newDay)
console.log('▶️ [Admin] Status atualizado:', newStatus)

// AoVivo.tsx
console.log('🗓️ [AoVivo] Dia mudou no servidor:', selectedDay, '→', eventState.current_day)
console.log('🎮 [AoVivo] Status do evento:', eventState.status)
```

### Notifications Tracking

```typescript
// useNotifications.ts
console.log('🔔 [useNotifications] Setting up realtime subscription for user:', user.id)
console.log('🔔 [useNotifications] Subscription status:', status)
console.log('🔔 [useNotifications] New notification received:', payload)
console.log('🔔 [useNotifications] Unread count incremented')
```

### Supabase Realtime

```typescript
// useEventState.ts
console.log('🎮 [useEventState] Setting up realtime subscription')
console.log('🎮 [useEventState] Subscription status:', status)
console.log('🎮 [useEventState] State changed:', payload)
```

---

## 📦 Dependências

### Supabase Realtime

```typescript
import { supabase } from '../lib/supabase'

const channel = supabase
  .channel('channel_name')
  .on('postgres_changes', { ... }, callback)
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

### Framer Motion

```typescript
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {show && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  )}
</AnimatePresence>
```

### Lucide Icons

```typescript
import { Coffee, Pause, Play, Activity } from 'lucide-react'

<Coffee size={32} color="#F97316" />
```

---

## 🧪 Testes Manuais

### Teste 1: Sincronização de Dia

1. Abrir Admin em uma aba
2. Abrir AoVivo (como participante) em outra aba
3. No Admin, clicar em "DIA 2"
4. **Esperado:** Badge em AoVivo muda para "DIA 2" (roxo) em <2s
5. **Console:** `🗓️ [AoVivo] Dia mudou no servidor: 1 → 2`

### Teste 2: Notificações em Tempo Real

1. Admin clica "PAUSAR"
2. **Esperado:** Notificação aparece no drawer do participante
3. **Console:** `🔔 [useNotifications] New notification received`
4. **UI:** Badge vermelho com count "1"
5. Participante abre drawer
6. Participante marca como lida
7. **Esperado:** Badge desaparece

### Teste 3: Modal de Almoço

1. Admin clica "ALMOÇO"
2. **Esperado:** Modal aparece com horário sugerido
3. Admin ajusta horário para 13:30
4. Admin clica "Confirmar"
5. **Esperado:** Modal fecha, notificação enviada com "A transmissão retorna às 13:30"
6. **Participante:** Recebe notificação com horário correto

### Teste 4: Botões Mutuamente Exclusivos

1. Admin clica "ALMOÇO"
2. **Esperado:** Botões "PAUSAR" e "ATIVIDADE" ficam disabled (opacity 0.5)
3. Admin clica "RETOMAR ALMOÇO"
4. **Esperado:** Botões voltam a ficar enabled
5. **Status:** Volta para 'live'

---

## 🎯 Boas Práticas

### 1. Sempre Use useEffect para Sincronização

```typescript
// ✅ CORRETO
useEffect(() => {
  if (eventState?.current_day !== selectedDay) {
    setSelectedDay(eventState.current_day)
  }
}, [eventState?.current_day])

// ❌ ERRADO (não sincroniza)
const [selectedDay, setSelectedDay] = useState(1)
```

### 2. Sempre Cleanup Subscriptions

```typescript
// ✅ CORRETO
useEffect(() => {
  const channel = supabase.channel('...')

  return () => {
    supabase.removeChannel(channel)
  }
}, [])

// ❌ ERRADO (memory leak)
useEffect(() => {
  supabase.channel('...').subscribe()
}, [])
```

### 3. Sempre Use Console Logs para Debug

```typescript
// ✅ CORRETO
console.log('🗓️ [Component] Action:', data)

// ❌ ERRADO (difícil identificar)
console.log(data)
```

### 4. Sempre Valide Input do Usuário

```typescript
// ✅ CORRETO
if (!lunchReturnTime) {
  alert('Por favor, informe o horário')
  return
}

// ❌ ERRADO (envia notificação vazia)
await createNotification('lunch', `Retorna às ${lunchReturnTime}`)
```

---

## 📚 Referências

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Framer Motion AnimatePresence](https://www.framer.com/motion/animate-presence/)
- [React useEffect Guide](https://react.dev/reference/react/useEffect)
- [PostgreSQL GIN Indexes](https://www.postgresql.org/docs/current/gin.html)

---

**Última Atualização:** 2026-02-02
**Autor:** Claude Code + Andre Buric
