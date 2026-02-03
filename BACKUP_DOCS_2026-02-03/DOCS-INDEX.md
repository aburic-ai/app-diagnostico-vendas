# 📚 Índice de Documentação - App Diagnóstico de Vendas

## 🗂️ Documentação Disponível

### 📋 Changelogs

- **[CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md)**
  - Correções de sincronização Admin ↔ Participante
  - Sistema de notificações restaurado
  - Modal customizada para horário de almoço
  - Botões de status mutuamente exclusivos
  - _Última atualização: 2026-02-02_

### 🛠️ Guias Técnicos

- **[GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md)**
  - Como funciona a sincronização em tempo real
  - Arquitetura Supabase Realtime
  - Sistema de notificações
  - Troubleshooting e debugging
  - _Referência completa para manutenção_

### 🎨 Patterns & Components

- **[PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md)**
  - Template base para modais
  - Variações de cor (orange, cyan, purple, green, red)
  - Variações de input (text, time, date, textarea, select)
  - Uso avançado (validação, loading, múltiplos inputs)
  - _Copy-paste ready code_

### 📝 Fluxos de Trabalho

- **[FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md)**
  - Pipeline completo de áudio personalizado
  - GHL → Supabase → OpenAI → ElevenLabs
  - Webhooks e Edge Functions
  - _Workflow 2 implementado_

- **[GHL-WORKFLOW-2-VARIAVEIS.md](./GHL-WORKFLOW-2-VARIAVEIS.md)**
  - Variáveis para copiar/colar no GHL
  - Configuração de custom fields
  - Headers e body do webhook
  - _Referência rápida_

### 📊 Planejamento

- **[PLANO (serene-knitting-otter.md)](./.claude/plans/serene-knitting-otter.md)**
  - Plano geral do projeto
  - Tarefas urgentes (Countdown, Tela Finalizado)
  - Avisos Clickables (próxima feature)
  - Sistema 30-60-90 Personalizado
  - Chat IA com persistência
  - _Roadmap completo_

---

## 🎯 Quick Start

### Para Desenvolvedores Novos no Projeto

1. **Entender o Sistema:**
   - Ler [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md)
   - Ver [CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md) para últimas mudanças

2. **Começar a Desenvolver:**
   - Usar [PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md) para criar UIs
   - Consultar guias de troubleshooting quando necessário

3. **Entender o Fluxo de Áudio:**
   - Ler [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md)
   - Usar [GHL-WORKFLOW-2-VARIAVEIS.md](./GHL-WORKFLOW-2-VARIAVEIS.md) para configurar

---

## 🔍 Busca Rápida

### Por Problema

| Problema | Documento | Seção |
|----------|-----------|-------|
| Dia não sincroniza | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | Troubleshooting > Dia não sincroniza |
| Notificações não aparecem | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | Troubleshooting > Notificações |
| Modal não abre | [PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md) | Troubleshooting |
| Áudio não gera | [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md) | Debugging |
| GHL webhook falha | [GHL-WORKFLOW-2-VARIAVEIS.md](./GHL-WORKFLOW-2-VARIAVEIS.md) | Troubleshooting |

### Por Feature

| Feature | Documento | Status |
|---------|-----------|--------|
| Sistema XP | [CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md) | ✅ 100% |
| Sincronização Evento | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | ✅ 100% |
| Notificações Realtime | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | ✅ 100% |
| Áudio Personalizado | [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md) | ✅ 100% |
| Modal Customizada | [PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md) | ✅ 100% |
| Avisos Clickables | Plano | ⏳ Pendente |
| Sistema 30-60-90 | Plano | ⏳ Pendente |
| Chat IA | Plano | ⏳ Pendente |

### Por Componente

| Componente | Documento | Localização |
|------------|-----------|-------------|
| Admin.tsx | [CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md) | src/pages/Admin.tsx |
| AoVivo.tsx | [CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md) | src/pages/AoVivo.tsx |
| useNotifications | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | src/hooks/useNotifications.ts |
| useEventState | [GUIA-SINCRONIZACAO-EVENTO.md](./GUIA-SINCRONIZACAO-EVENTO.md) | src/hooks/useEventState.ts |
| Modal Pattern | [PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md) | Template reutilizável |

---

## 📁 Estrutura de Arquivos

```
app-diagnostico-vendas/
├── DOCS-INDEX.md                           # Este arquivo
├── CHANGELOG-2026-02-02.md                 # Changelog detalhado
├── GUIA-SINCRONIZACAO-EVENTO.md            # Guia técnico
├── PATTERN-MODAL-CUSTOMIZADA.md            # Pattern de modais
├── FLUXO_AUDIO_BOASVINDAS.md               # Fluxo de áudio
├── GHL-WORKFLOW-2-VARIAVEIS.md             # Variáveis GHL
│
├── src/
│   ├── pages/
│   │   ├── Admin.tsx                       # ✅ Modificado 2026-02-02
│   │   └── AoVivo.tsx                      # ✅ Modificado 2026-02-02
│   │
│   ├── hooks/
│   │   ├── useNotifications.ts             # Sistema de avisos
│   │   ├── useEventState.ts                # Sincronização evento
│   │   └── useAuth.ts                      # Autenticação
│   │
│   ├── components/ui/
│   │   ├── NotificationDrawer.tsx          # Drawer de avisos
│   │   ├── NotificationToast.tsx           # Toast notifications
│   │   ├── EventFinishedView.tsx           # ✅ Novo 2026-02-02
│   │   └── ...
│   │
│   └── lib/
│       └── supabase.ts                     # Cliente Supabase
│
└── supabase/
    ├── migrations/
    │   └── notifications-v3-read-by.sql    # ✅ Nova 2026-02-02
    │
    └── functions/
        ├── generate-audio/                  # Edge Function áudio
        └── send-whatsapp/                   # Edge Function WhatsApp
```

---

## 🧪 Testes

### Checklist de Testes

Use esta checklist antes de fazer deploy:

**Sincronização:**
- [ ] Admin muda dia → AoVivo atualiza
- [ ] Admin muda módulo → AoVivo atualiza
- [ ] Badge "DIA 1/2" muda de cor

**Notificações:**
- [ ] PAUSAR envia notificação
- [ ] ALMOÇO abre modal → envia notificação com horário
- [ ] ATIVIDADE envia notificação
- [ ] Drawer mostra notificações não lidas
- [ ] Marcar como lida funciona

**Modal:**
- [ ] Modal abre ao clicar ALMOÇO
- [ ] Input type="time" aceita horário
- [ ] Cancelar fecha modal
- [ ] Confirmar envia notificação
- [ ] Click fora fecha modal

**Áudio:**
- [ ] Webhook GHL dispara Edge Function
- [ ] Áudio gerado via OpenAI + ElevenLabs
- [ ] URL salvo em custom field
- [ ] Áudio reproduz no navegador

---

## 🚀 Deploy Checklist

Antes de fazer deploy para produção:

### Backend (Supabase)
- [ ] Migrations executadas
- [ ] Edge Functions deployed
- [ ] Secrets configurados (OPENAI_API_KEY, etc)
- [ ] RLS policies testadas
- [ ] Índices criados

### Frontend (Vercel/Netlify)
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Environment variables configuradas
- [ ] URLs de produção atualizadas

### GHL
- [ ] Workflow 2 configurado
- [ ] Webhook URL correta
- [ ] Custom fields criados
- [ ] Teste manual executado

---

## 📞 Contato e Suporte

### Desenvolvedor Principal
- **Nome:** Andre Buric
- **Assistente:** Claude Code (Anthropic)

### Recursos Úteis
- [Supabase Docs](https://supabase.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 Como Contribuir com a Documentação

### Adicionar Novo Changelog

1. Criar arquivo `CHANGELOG-YYYY-MM-DD.md`
2. Seguir estrutura de [CHANGELOG-2026-02-02.md](./CHANGELOG-2026-02-02.md)
3. Adicionar link neste índice

### Adicionar Novo Pattern

1. Criar arquivo `PATTERN-NOME-DO-PATTERN.md`
2. Seguir estrutura de [PATTERN-MODAL-CUSTOMIZADA.md](./PATTERN-MODAL-CUSTOMIZADA.md)
3. Incluir template copy-paste ready
4. Adicionar link neste índice

### Adicionar Novo Guia

1. Criar arquivo `GUIA-NOME-DO-GUIA.md`
2. Incluir troubleshooting section
3. Incluir exemplos práticos
4. Adicionar link neste índice

---

## ⚡ Atalhos Rápidos

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Deploy Edge Function
supabase functions deploy generate-audio

# Run Migration
# (executar SQL no Supabase Dashboard)
```

### Links Rápidos

- [Supabase Dashboard](https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx)
- [Vercel Dashboard](#) _(adicionar link quando deploy)_
- [GHL Workflows](#) _(adicionar link)_

---

## 📊 Status do Projeto

```
Progresso Geral: ████████████░░░░░░░░ 60%

✅ Sistema XP                    100%
✅ Sincronização Evento          100%
✅ Notificações Realtime         100%
✅ Áudio Personalizado           100%
✅ Modal Customizada             100%
🟡 GHL Workflow 2                 90%
⏳ Avisos Clickables               0%
⏳ Sistema 30-60-90                0%
⏳ Chat IA                         0%
⏳ GHL Workflow 1                  0%
⏳ Template WhatsApp Meta          0%
```

**Próxima Sprint:** Avisos Clickables + Countdown + Tela Finalizado

---

**Última Atualização:** 2026-02-02 22:35 BRT
**Mantido por:** Claude Code + Andre Buric
**Versão:** 1.0.0
