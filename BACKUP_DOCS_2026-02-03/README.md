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
| Vercel | Deploy |

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
│   └── ui/           # Componentes reutilizáveis
├── data/
│   ├── modules.ts    # 17 módulos do evento (0-16)
│   └── survey-config.ts # Pesquisa de calibragem (Single Source of Truth)
├── lib/
│   └── whatsapp-message.ts # Gerador de prompt WhatsApp (IA)
├── pages/            # Páginas da aplicação
├── styles/           # Theme tokens
└── App.tsx           # Rotas
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
| Countdown | Timer regressivo |
| ProgressBar | Barra de progresso com glow |
| BottomNav | Navegação sequencial |
| LiveTicker | Status do evento ao vivo |
| DiagnosticSlider | Slider de diagnóstico |

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

### 📝 Atualizações e Mudanças
- [CHANGELOG.md](./CHANGELOG.md) - 📝 Histórico completo de mudanças e versões

### Design e Arquitetura
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Sistema de design completo
- [PLANO_COMPLETO_INFRAESTRUTURA.md](./PLANO_COMPLETO_INFRAESTRUTURA.md) - Arquitetura e backend

### Segurança e Validação
- [SECURITY-VALIDATION.md](./SECURITY-VALIDATION.md) - 🔒 Sistema de validação de compras (CRÍTICO)
- [DEPLOY-SECURITY.md](./DEPLOY-SECURITY.md) - 🚀 Guia rápido de deploy da validação

### Integrações e Deploy
- [DEPLOY-WEBHOOK.md](./DEPLOY-WEBHOOK.md) - Deploy do webhook Hotmart
- [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md) - Documentação do webhook Hotmart

### 🎙️ Áudio Personalizado via IA (NOVO)
- [IMPLEMENTACAO-AUDIO-RESUMO.md](./IMPLEMENTACAO-AUDIO-RESUMO.md) - ✅ Resumo completo da implementação
- [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md) - Arquitetura e fluxo do sistema
- [GHL-WORKFLOW-2-VARIAVEIS.md](./GHL-WORKFLOW-2-VARIAVEIS.md) - 📋 Variáveis para copiar/colar no GHL
- [GUIA-SETUP-GHL-AUDIO.md](./GUIA-SETUP-GHL-AUDIO.md) - Setup passo-a-passo do Go High Level
- `test-generate-audio.sh` - Script de teste da Edge Function

### Migrations SQL
- `supabase-validation-function.sql` - Função de validação de compradores
- `supabase-migrations-access-requests.sql` - Tabela de solicitações de acesso
- `supabase-migrations-survey-audio-files.sql` - Sistema de áudio personalizado via IA
- `fix-survey-responses-rls-v2.sql` - Row Level Security atualizado
- `supabase-migrations-purchases-v3.sql` - Campo manual_approval
- `supabase-migrations-purchases-v2.sql` - Campos de comprador (nome, documento, telefone)

## Evento

- **Data:** 28/02/2026 e 01/03/2026
- **Horário:** 09:30
- **Participantes esperados:** ~1000

---

Desenvolvido para a Imersão Diagnóstico de Vendas
