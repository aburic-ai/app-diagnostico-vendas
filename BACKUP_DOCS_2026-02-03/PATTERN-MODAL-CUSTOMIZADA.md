# Pattern: Modal Customizada com Framer Motion

## 📋 Template Base

Use este template para criar modais customizadas consistentes com o design system.

### Estrutura Completa

```typescript
import { motion, AnimatePresence } from 'framer-motion'
import { IconName } from 'lucide-react'
import { theme } from '../styles/theme'

// 1. STATE
const [showModal, setShowModal] = useState(false)
const [inputValue, setInputValue] = useState('')

// 2. HANDLER
const handleConfirm = async () => {
  if (!inputValue) {
    alert('Por favor, preencha o campo')
    return
  }

  // Sua lógica aqui
  await doSomething(inputValue)

  // Fechar e limpar
  setShowModal(false)
  setInputValue('')
}

// 3. JSX (antes do closing </div> do componente)
<AnimatePresence>
  {showModal && (
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
      onClick={() => setShowModal(false)}
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
          <IconName size={32} color="#F97316" />
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
          Título da Modal
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
          Descrição do que essa modal faz
        </p>

        {/* Input (customizar conforme necessário) */}
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
            Label do Campo
          </label>
          <input
            type="text" // ou "time", "date", "number", etc
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Placeholder"
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
          {/* Cancelar */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(false)}
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

          {/* Confirmar */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
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

---

## 🎨 Variações de Cor

### Orange (Padrão - Almoço, Avisos)

```typescript
// Icon Badge
background: 'rgba(249, 115, 22, 0.15)',
border: '2px solid rgba(249, 115, 22, 0.4)',

// Icon Color
color="#F97316"

// Input Border
border: '1px solid rgba(249, 115, 22, 0.3)',

// Confirm Button
background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
```

### Cyan (Info, Diagnóstico)

```typescript
// Icon Badge
background: 'rgba(34, 211, 238, 0.15)',
border: '2px solid rgba(34, 211, 238, 0.4)',

// Icon Color
color="#22D3EE"

// Input Border
border: '1px solid rgba(34, 211, 238, 0.3)',

// Confirm Button
background: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)',
```

### Purple (Oferta, Premium)

```typescript
// Icon Badge
background: 'rgba(168, 85, 247, 0.15)',
border: '2px solid rgba(168, 85, 247, 0.4)',

// Icon Color
color="#A855F7"

// Input Border
border: '1px solid rgba(168, 85, 247, 0.3)',

// Confirm Button
background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
```

### Green (Sucesso, Confirmação)

```typescript
// Icon Badge
background: 'rgba(34, 197, 94, 0.15)',
border: '2px solid rgba(34, 197, 94, 0.4)',

// Icon Color
color="#22C55E"

// Input Border
border: '1px solid rgba(34, 197, 94, 0.3)',

// Confirm Button
background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
```

### Red (Perigo, Deletar)

```typescript
// Icon Badge
background: 'rgba(239, 68, 68, 0.15)',
border: '2px solid rgba(239, 68, 68, 0.4)',

// Icon Color
color="#EF4444"

// Input Border
border: '1px solid rgba(239, 68, 68, 0.3)',

// Confirm Button
background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
```

---

## 🧩 Variações de Input

### Text Input (Padrão)

```typescript
<input
  type="text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  placeholder="Digite aqui..."
  style={{ /* ... */ }}
/>
```

### Time Input

```typescript
<input
  type="time"
  value={timeValue}
  onChange={(e) => setTimeValue(e.target.value)}
  style={{ /* ... */ }}
/>
```

### Date Input

```typescript
<input
  type="date"
  value={dateValue}
  onChange={(e) => setDateValue(e.target.value)}
  style={{ /* ... */ }}
/>
```

### Number Input

```typescript
<input
  type="number"
  value={numberValue}
  onChange={(e) => setNumberValue(e.target.value)}
  min="0"
  max="100"
  placeholder="0"
  style={{ /* ... */ }}
/>
```

### Textarea

```typescript
<textarea
  value={textValue}
  onChange={(e) => setTextValue(e.target.value)}
  rows={4}
  placeholder="Digite aqui..."
  style={{
    /* ... mesmo style do input */
    resize: 'vertical',
    minHeight: '100px',
  }}
/>
```

### Select

```typescript
<select
  value={selectValue}
  onChange={(e) => setSelectValue(e.target.value)}
  style={{ /* ... mesmo style do input */ }}
>
  <option value="">Selecione...</option>
  <option value="opcao1">Opção 1</option>
  <option value="opcao2">Opção 2</option>
</select>
```

---

## 🎭 Variações de Layout

### Modal Pequena (Confirmação Simples)

```typescript
maxWidth: '360px',
padding: '24px',
```

### Modal Média (Padrão - Formulário)

```typescript
maxWidth: '440px',
padding: '32px',
```

### Modal Grande (Wizard, Multi-step)

```typescript
maxWidth: '600px',
padding: '40px',
```

### Modal Full-Width (Chat, Editor)

```typescript
maxWidth: '90vw',
maxHeight: '90vh',
padding: '32px',
overflow: 'auto',
```

---

## 🚀 Uso Avançado

### Modal com Múltiplos Inputs

```typescript
<div style={{ marginBottom: '28px' }}>
  <label style={{ /* ... */ }}>Nome</label>
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    style={{ /* ... */ }}
  />
</div>

<div style={{ marginBottom: '28px' }}>
  <label style={{ /* ... */ }}>Email</label>
  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    style={{ /* ... */ }}
  />
</div>
```

### Modal com Validação

```typescript
const handleConfirm = async () => {
  // Validação
  if (!inputValue) {
    setError('Campo obrigatório')
    return
  }

  if (inputValue.length < 3) {
    setError('Mínimo 3 caracteres')
    return
  }

  // Limpar erro
  setError('')

  // Processar
  await doSomething(inputValue)
}

// No JSX, adicionar mensagem de erro:
{error && (
  <p style={{
    color: '#EF4444',
    fontSize: '12px',
    marginTop: '8px',
  }}>
    {error}
  </p>
)}
```

### Modal com Loading State

```typescript
const [loading, setLoading] = useState(false)

const handleConfirm = async () => {
  setLoading(true)
  try {
    await doSomething(inputValue)
  } finally {
    setLoading(false)
    setShowModal(false)
  }
}

// Botão Confirmar
<motion.button
  onClick={handleConfirm}
  disabled={loading}
  style={{
    opacity: loading ? 0.7 : 1,
    cursor: loading ? 'wait' : 'pointer',
    /* ... */
  }}
>
  {loading ? 'Processando...' : 'Confirmar'}
</motion.button>
```

### Modal com Terceiro Botão

```typescript
<div style={{ display: 'flex', gap: '12px' }}>
  <motion.button
    onClick={() => setShowModal(false)}
    style={{ flex: 1, /* ... Cancelar */ }}
  >
    Cancelar
  </motion.button>

  <motion.button
    onClick={handleSecondaryAction}
    style={{
      flex: 1,
      background: 'rgba(100, 116, 139, 0.3)',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      /* ... */
    }}
  >
    Opção 2
  </motion.button>

  <motion.button
    onClick={handleConfirm}
    style={{ flex: 1, /* ... Confirmar */ }}
  >
    Confirmar
  </motion.button>
</div>
```

---

## ⚡ Atalhos de Teclado

### ESC para Fechar

```typescript
useEffect(() => {
  if (!showModal) return

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowModal(false)
    }
  }

  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [showModal])
```

### Enter para Confirmar

```typescript
<input
  type="text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }}
  style={{ /* ... */ }}
/>
```

---

## 🎯 Checklist de Implementação

Ao criar uma nova modal, verifique:

- [ ] `AnimatePresence` importado do `framer-motion`
- [ ] State `showModal` criado
- [ ] State para input(s) criado
- [ ] Handler `handleConfirm` implementado com validação
- [ ] Backdrop fecha ao clicar fora (`onClick` no overlay)
- [ ] Content não fecha ao clicar dentro (`e.stopPropagation()`)
- [ ] Botão Cancelar fecha modal
- [ ] Botão Confirmar valida e processa
- [ ] Input tem `onFocus` e `onBlur` para highlight
- [ ] Modal limpa state ao fechar (`setInputValue('')`)
- [ ] zIndex maior que outros elementos (10001)
- [ ] Ícone apropriado para o contexto
- [ ] Cores consistentes com design system
- [ ] Responsivo (maxWidth + width: 90%)

---

## 🐛 Troubleshooting

### Modal não aparece

```typescript
// Verificar se AnimatePresence está envolvendo corretamente
<AnimatePresence>
  {showModal && ( // ← Deve ter condição
    <motion.div>
```

### Modal não fecha ao clicar fora

```typescript
// Backdrop deve ter onClick
<motion.div
  onClick={() => setShowModal(false)} // ← Aqui
  style={{ /* overlay */ }}
>
  <motion.div
    onClick={(e) => e.stopPropagation()} // ← E aqui
    style={{ /* content */ }}
  >
```

### Input não fica focado

```typescript
// Adicionar autofocus (opcional)
<input
  type="text"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  autoFocus // ← Aqui
  style={{ /* ... */ }}
/>
```

### Animação não suave

```typescript
// Verificar se transition está configurado
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ duration: 0.2 }} // ← Adicionar se necessário
>
```

---

## 📚 Exemplos Práticos

### Exemplo 1: Confirmar Deleção

```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false)

const handleConfirmDelete = async () => {
  await deleteItem(itemId)
  setShowDeleteModal(false)
  toast.success('Item deletado')
}

// Modal com cor vermelha (perigo)
// Ícone: Trash2
// Title: "Confirmar Exclusão"
// Subtitle: "Esta ação não pode ser desfeita"
// Botão: "Deletar" (vermelho)
```

### Exemplo 2: Agendar Evento

```typescript
const [showScheduleModal, setShowScheduleModal] = useState(false)
const [eventDate, setEventDate] = useState('')
const [eventTime, setEventTime] = useState('')

const handleSchedule = async () => {
  if (!eventDate || !eventTime) {
    alert('Preencha data e horário')
    return
  }

  await scheduleEvent(eventDate, eventTime)
  setShowScheduleModal(false)
}

// Modal com cor cyan (info)
// Ícone: Calendar
// Title: "Agendar Evento"
// Dois inputs: date + time
```

### Exemplo 3: Enviar Mensagem

```typescript
const [showMessageModal, setShowMessageModal] = useState(false)
const [messageText, setMessageText] = useState('')

const handleSendMessage = async () => {
  if (!messageText.trim()) {
    alert('Digite uma mensagem')
    return
  }

  await sendMessage(messageText)
  setShowMessageModal(false)
  setMessageText('')
}

// Modal com cor orange (aviso)
// Ícone: Send
// Title: "Enviar Mensagem"
// Textarea
```

---

**Última Atualização:** 2026-02-02
**Baseado em:** Modal de Almoço (Admin.tsx)
**Autor:** Claude Code + Andre Buric
