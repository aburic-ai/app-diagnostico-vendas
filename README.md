# App Diagnóstico de Vendas

> **"ISSO NÃO É UM APP. É UMA MÁQUINA DE COMPROMETIMENTO."**

Infraestrutura cognitiva da Imersão Diagnóstico de Vendas - um ambiente de diagnóstico ativo que acompanha o participante antes, durante e depois do evento.

## Visão Geral

Este aplicativo **não é** um curso, comunidade ou repositório de conteúdo.

**É** um ambiente de diagnóstico ativo que:
- Organiza o pensamento do participante em tempo real
- Registra diagnósticos e torna visíveis os gargalos reais da jornada de venda
- Conduz naturalmente à decisão de seguir para a Imersão IMPACT presencial

## Stack Tecnológico

| Tecnologia | Uso |
|------------|-----|
| React + Vite | Framework frontend |
| TypeScript | Tipagem estática |
| Framer Motion | Animações |
| Lucide React | Ícones |
| Supabase | Auth, Database, Realtime, Storage, Edge Functions |
| Vercel | Deploy frontend |
| OpenAI GPT-4o-mini | Geração de plano de ação personalizado |
| ElevenLabs | Áudio personalizado via TTS |

## Rotas do App

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | Login | Cockpit Access - tela de entrada |
| `/pre-evento` | Pré-Evento | Dashboard de preparação com gamification |
| `/ao-vivo` | Ao Vivo | Diagnóstico IMPACT durante o evento |
| `/pos-evento` | Pós-Evento | Consolidação e plano de ação |
| `/admin` | Admin | Painel de controle (desktop only) |
| `/obrigado` | Thank You | Pós-compra Hotmart |
| `/demo` | Demo | Preview para captura de vídeo |
| `/dev` | DevNav | Navegação de desenvolvimento |

## Estrutura de Pastas

```
src/
├── components/
│   └── ui/              # Componentes reutilizáveis (20+)
├── config/
│   └── xp-system.ts     # Sistema de XP centralizado (1000 XP total)
├── contexts/
│   └── AuthContext.tsx   # Context de autenticação Supabase
├── data/
│   ├── modules.ts       # 17 módulos do evento (0-16)
│   └── survey-config.ts # Pesquisa de calibragem (Single Source of Truth)
├── hooks/
│   ├── useAuth.ts           # Autenticação
│   ├── useHeartbeat.ts      # Presença em tempo real (30s)
│   ├── useEventState.ts     # Estado do evento + controle de abas
│   ├── useUserProgress.ts   # XP e steps completados
│   ├── useNotifications.ts  # Notificações realtime
│   ├── useActionPlan.ts     # Plano de ação 7 dias (IA)
│   ├── useAIChat.ts         # Chat com IA
│   └── useDiagnosticScore.ts # Score IMPACT
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── whatsapp-message.ts  # Gerador de prompt WhatsApp (IA)
├── pages/               # Páginas da aplicação
├── styles/              # Theme tokens
└── App.tsx              # Rotas
supabase/
└── functions/
    ├── hotmart-webhook/       # Webhook Hotmart
    ├── generate-audio/        # Áudio personalizado (ElevenLabs)
    └── generate-action-plan/  # Plano de ação (GPT-4o-mini)
```

## Componentes UI

| Componente | Descrição |
|------------|-----------|
| AppLayout | Layout responsivo (mobile/desktop) |
| PageWrapper | Wrapper com background animado |
| Button | Botão com beam animation |
| Card | Container glassmorphism |
| Input | Input com borda gradiente |
| RadarChart | Gráfico radar IMPACT |
| Countdown | Timer regressivo dinâmico (event_state) |
| ProgressBar | Barra de progresso com glow |
| BottomNav | Navegação sequencial com status |
| LiveTicker | Status do evento ao vivo |
| DiagnosticSlider | Slider de diagnóstico |
| ActionPlan | Plano 7 dias com blur/lock em futuros |
| FinalReport | Relatório final com mini radar |
| NPSForm | Formulário NPS bloqueante |
| AIChatInterface | Chat com assistente IA |
| AvatarButton | Botão avatar com foto |
| NotificationDrawer | Drawer de notificações |
| LiveEventModal | Modal de redirecionamento ao vivo |

## Scripts

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## Deploy

O projeto está configurado para deploy automático no Vercel via GitHub:

```bash
git push origin main
```

## Documentação Adicional

> **Navegação centralizada:** [03-DOCS-INDEX.md](./03-DOCS-INDEX.md)

### Visão Geral
- [02-CHANGELOG.md](./02-CHANGELOG.md) - Histórico completo de mudanças (v2.4.0)
- [CHANGELOG.md](./CHANGELOG.md) - Changelog resumido (legacy)
- [PROGRESS-REPORT.md](./PROGRESS-REPORT.md) - Relatório de progresso

### Core Features
- [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md) - Score IMPACT e gargalo
- [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md) - Controle de acesso às abas
- [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md) - Áudio personalizado (OpenAI + ElevenLabs)

### Arquitetura e Banco de Dados
- [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md) - Schema do banco
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Sistema de design

### Guias para Desenvolvedores
- [50-QUICK-START-NEW-DEVS.md](./50-QUICK-START-NEW-DEVS.md) - Onboarding rápido
- [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md) - Solução de problemas
- [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md) - Guia de deployment

### Segurança e Integrações
- [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md) - Validação de compras
- [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md) - Webhook Hotmart

## Evento

- **Data:** 28/02/2026 e 01/03/2026
- **Horário:** 09:30
- **Participantes esperados:** ~1000

## Versão Atual

**v2.4.0** (2026-02-04) - Event Prep & UX Polish

---

Desenvolvido para a Imersão Diagnóstico de Vendas
