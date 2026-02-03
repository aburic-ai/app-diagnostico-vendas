# 50. QUICK START - NEW DEVELOPERS

**Bem-vindo ao time!** 🚀
Este guia vai te colocar operacional em 2 dias.

**Última Atualização:** 2026-02-03

---

## 📋 ÍNDICE

- [Visão Geral do Projeto](#visao-geral-do-projeto)
- [Day 1: Setup & Environment (2h)](#day-1-setup--environment-2h)
- [Day 2: First Contribution (4h)](#day-2-first-contribution-4h)
- [Recursos Essenciais](#recursos-essenciais)
- [Next Steps](#next-steps)

---

## VISÃO GERAL DO PROJETO

### O que é o App Diagnóstico de Vendas?

Plataforma gamificada para evento online "Imersão Diagnóstico de Vendas" do André Buric, com:
- **Pré-Evento:** Preparação, aulas bônus, protocolo de iniciação
- **Ao Vivo:** Transmissão de 2 dias (17 módulos), checkins, notificações em tempo real
- **Pós-Evento:** Radar personalizado, plano 7 dias, oferta IMPACT

### Stack Principal

| Layer | Tech |
|-------|------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | Vanilla CSS + Framer Motion |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| **Deploy** | Vercel (frontend) + Supabase (backend) |
| **Integrations** | Hotmart (compras), Go High Level (WhatsApp), OpenAI + ElevenLabs (áudio IA) |

### Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│ VERCEL (Frontend)                                        │
│ React SPA → /pre-evento, /ao-vivo, /pos-evento, /admin │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ SUPABASE (Backend)                                       │
│ • PostgreSQL (profiles, purchases, event_state, etc.)   │
│ • Auth (email + password)                               │
│ • Realtime (event updates, notifications)               │
│ • Edge Functions (hotmart-webhook, generate-audio)      │
│ • Storage (survey-audios bucket)                        │
└─────────────────────────────────────────────────────────┘
                 ▲
                 │
        ┌────────┴────────┐
        │                 │
   HOTMART           GO HIGH LEVEL
   (Webhook)         (WhatsApp)
```

---

## DAY 1: Setup & Environment (2h)

### Step 1: Prerequisites (15 min)

**Instale:**
- [Node.js 18+](https://nodejs.org/) (verificar: `node -v`)
- [Git](https://git-scm.com/) (verificar: `git --version`)
- [VS Code](https://code.visualstudio.com/) (recomendado) ou seu editor preferido
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional, útil para migrations)

**Acesso necessário:**
- [ ] Repositório Git (peça acesso ao repo)
- [ ] Supabase Dashboard (peça invite para o projeto)
- [ ] Vercel Dashboard (peça acesso ao projeto)
- [ ] Documentação (você já tem! Este repo)

---

### Step 2: Clone & Install (10 min)

```bash
# Clone o repositório
git clone <repo-url>
cd app-diagnostico-vendas

# Instalar dependências
npm install

# Verificar instalação
npm run dev
# Deve abrir http://localhost:5176
```

**Resultado esperado:**
- Browser abre automaticamente em `http://localhost:5176`
- Console sem erros críticos
- Página de login aparece

---

### Step 3: Environment Variables (10 min)

**Criar arquivo `.env.local`:**

```bash
# Na raiz do projeto
touch .env.local
```

**Adicionar variáveis (copiar de .env.example ou pedir ao time):**

```env
VITE_SUPABASE_URL=https://yvjzkhxczbxidtdmkafx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional (apenas se trabalhar com Edge Functions localmente)
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
```

**⚠️ IMPORTANTE:** Peça as keys ao time. NÃO commite o arquivo `.env.local`!

**Reiniciar dev server:**
```bash
# Ctrl+C para parar, depois:
npm run dev
```

---

### Step 4: Criar Conta de Teste (10 min)

**1. Acesse o app local:**
```
http://localhost:5176/obrigado
```

**2. Simular comprador válido:**
- Opção A: Peça ao admin para adicionar seu email com `manual_approval = true`
- Opção B: Use email de teste que já existe no banco

**SQL para admin executar (no Supabase SQL Editor):**
```sql
-- Criar purchase de teste para seu email
INSERT INTO purchases (
  transaction_id,
  product_slug,
  price,
  buyer_name,
  status,
  manual_approval,
  purchased_at
) VALUES (
  'HP_DEV_TEST_001',
  'imersao-diagnostico-vendas',
  1.00,
  'Seu Nome',
  'approved',
  true,  -- Bypass para devs
  NOW()
);
```

**3. Preencher Protocolo de Iniciação (8 questões)**

**4. Criar senha**

**5. Login:**
```
http://localhost:5176/login
```

**Resultado esperado:**
- ✅ Login bem-sucedido
- ✅ Redirecionado para `/pre-evento`
- ✅ Badge de XP aparece no topo

---

### Step 5: Explorar o App (30 min)

**Navegue por todas as páginas:**

**1. Pré-Evento (`/pre-evento`)**
- Ver steps de gamification
- Testar modal de perfil (clique no avatar)
- Verificar aulas bônus

**2. Ao Vivo (`/ao-vivo`)**
- Ver countdown (se evento offline)
- OU ver módulos (se evento live)
- Testar checkin de módulo

**3. Pós-Evento (`/pos-evento`)**
- Ver radar personalizado
- Verificar plano 7 dias

**4. Admin (`/admin`)** - ⚠️ Requer `is_admin = true`
```sql
-- Admin deve executar:
UPDATE profiles SET is_admin = true WHERE email = 'seu-email@exemplo.com';
```
- Explorar controles de evento
- Ver lista de participantes
- Testar envio de notificações

---

### Step 6: Entender Estrutura do Código (30 min)

**Principais diretórios:**

```
app-diagnostico-vendas/
├── src/
│   ├── components/
│   │   └── ui/              # Componentes reutilizáveis (Button, Card, etc.)
│   ├── config/
│   │   └── xp-system.ts     # Sistema de XP centralizado
│   ├── contexts/
│   │   └── AuthContext.tsx  # Context de autenticação
│   ├── data/
│   │   ├── modules.ts       # 17 módulos do evento (Dia 1 + Dia 2)
│   │   └── survey-config.ts # 8 questões do Protocolo
│   ├── hooks/
│   │   ├── useUserProgress.ts    # Hook de progresso do usuário
│   │   ├── useEventState.ts      # Hook de estado do evento
│   │   └── useNotifications.ts   # Hook de notificações
│   ├── lib/
│   │   └── supabase.ts      # Cliente Supabase
│   ├── pages/               # Páginas da aplicação
│   │   ├── PreEvento.tsx
│   │   ├── AoVivo.tsx
│   │   ├── PosEvento.tsx
│   │   ├── Admin.tsx
│   │   ├── ThankYou.tsx
│   │   └── Login.tsx
│   ├── styles/
│   │   └── theme.ts         # Design tokens
│   └── App.tsx              # Rotas
├── supabase/
│   └── functions/           # Edge Functions
│       ├── hotmart-webhook/
│       └── generate-audio/
└── *.sql                    # Migrations SQL
```

**Leia (15 min cada):**
1. [02-CHANGELOG.md](./02-CHANGELOG.md) - Histórico de mudanças
2. [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md) - Schema do banco
3. [40-DESIGN-SYSTEM.md](./40-DESIGN-SYSTEM.md) - Design system (opcional)

---

### Step 7: Rodar Testes (15 min)

**Se houver testes configurados:**
```bash
npm run test
```

**Se não houver testes ainda:**
- Anote como melhoria futura
- Foco em exploração manual por enquanto

---

### ✅ Checklist Day 1

Ao final do Day 1, você deve ter:
- [x] Ambiente local rodando (http://localhost:5176)
- [x] Conta de teste criada e com acesso
- [x] Navegado por todas as 4 páginas principais
- [x] Lido changelog + schema reference
- [x] Entendido estrutura de pastas

**Se algo deu errado:** Ver [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)

---

## DAY 2: First Contribution (4h)

### Step 1: Escolher uma Issue/Task (30 min)

**Opções para primeira contribuição:**

**Nível 1 - Starter (1-2h):**
- [ ] Adicionar tooltip em botão existente
- [ ] Corrigir typo em texto
- [ ] Atualizar copy de uma mensagem
- [ ] Adicionar log de debug em função existente
- [ ] Melhorar acessibilidade (aria-labels)

**Nível 2 - Intermediate (2-4h):**
- [ ] Adicionar novo step de gamification
- [ ] Criar novo componente UI reutilizável
- [ ] Implementar nova query SQL
- [ ] Adicionar validação em formulário
- [ ] Corrigir bug reportado

**Nível 3 - Advanced (4-8h):**
- [ ] Implementar nova feature completa
- [ ] Refatorar componente grande
- [ ] Otimizar performance de página
- [ ] Integrar nova API externa
- [ ] Escrever migration SQL complexa

**👉 Recomendação para Day 2:** Escolha Nível 1 ou 2.

**Onde encontrar tasks:**
- Issues do GitHub/GitLab
- Backlog compartilhado (Trello/Notion/etc.)
- Pergunte ao time: "Qual seria uma boa primeira task?"

---

### Step 2: Criar Branch (5 min)

**Nomenclatura de branches:**
```bash
# Formato: tipo/descricao-curta
git checkout -b feat/add-tooltip-to-checkin-button
git checkout -b fix/typo-in-welcome-message
git checkout -b refactor/simplify-profile-modal
```

**Tipos:**
- `feat/` - Nova feature
- `fix/` - Bug fix
- `refactor/` - Refatoração de código
- `docs/` - Apenas documentação
- `style/` - Formatação, sem mudança de lógica
- `test/` - Adicionar testes

---

### Step 3: Fazer a Mudança (2h)

**Exemplo: Adicionar tooltip no botão de checkin**

**1. Localizar o componente:**
```bash
# Buscar "Fazer Check-in"
grep -r "Fazer Check-in" src/
# Resultado: src/pages/AoVivo.tsx:1234
```

**2. Abrir arquivo e entender contexto:**
```typescript
// src/pages/AoVivo.tsx (linha ~1234)
<motion.button
  onClick={handleCheckin}
  style={{ /* ... */ }}
>
  <Check size={18} />
  Fazer Check-in
</motion.button>
```

**3. Adicionar tooltip:**
```typescript
<motion.button
  onClick={handleCheckin}
  style={{ /* ... */ }}
  title="Clique para confirmar presença neste módulo e ganhar 20 XP"  // ✅ Novo
  aria-label="Fazer check-in e ganhar 20 XP"                         // ✅ Novo
>
  <Check size={18} />
  Fazer Check-in
</motion.button>
```

**4. Testar localmente:**
```bash
# Dev server deve estar rodando
# Hover no botão → tooltip aparece
# Leitor de tela → aria-label é lido
```

**5. Verificar em diferentes browsers (se possível):**
- Chrome ✅
- Firefox ✅
- Safari ✅

---

### Step 4: Commit & Push (15 min)

**1. Verificar mudanças:**
```bash
git status
git diff src/pages/AoVivo.tsx
```

**2. Commit:**
```bash
git add src/pages/AoVivo.tsx

git commit -m "feat: Add tooltip to check-in button

- Add title attribute for hover tooltip
- Add aria-label for screen readers
- Improves accessibility and UX"
```

**Formato de commit message:**
```
tipo: Título curto (50 chars max)

- Bullet point descrevendo mudança 1
- Bullet point descrevendo mudança 2
- Benefício ou motivo da mudança
```

**3. Push:**
```bash
git push origin feat/add-tooltip-to-checkin-button
```

---

### Step 5: Criar Pull Request (30 min)

**1. Abrir PR no GitHub/GitLab**

**2. Preencher template (se houver):**

```markdown
## Descrição
Adiciona tooltip no botão de check-in para melhorar UX e acessibilidade.

## Tipo de mudança
- [x] Nova feature (non-breaking change)
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Checklist
- [x] Testei localmente
- [x] Código segue style guide do projeto
- [x] Commit message segue convenção
- [ ] Testes automatizados adicionados (N/A para esta task)
- [x] Documentação atualizada (N/A para esta task)

## Screenshots (se aplicável)
[Adicionar screenshot do tooltip funcionando]

## Como testar
1. Rodar `npm run dev`
2. Fazer login
3. Ir em `/ao-vivo`
4. Hover no botão "Fazer Check-in"
5. Verificar que tooltip aparece com texto correto
```

**3. Marcar reviewers:**
- Adicione pelo menos 1 reviewer do time
- Se não souber quem, pergunte no chat

---

### Step 6: Code Review & Iterate (1h)

**Após criar PR:**
1. Avisar o time (chat/Slack): "Criei meu primeiro PR! #123"
2. Aguardar feedback
3. Se houver comentários, fazer ajustes:
   ```bash
   # Fazer mudanças sugeridas
   git add .
   git commit -m "fix: Address review comments"
   git push origin feat/add-tooltip-to-checkin-button
   ```

**Dicas para code review:**
- ✅ Seja receptivo ao feedback
- ✅ Faça perguntas se não entender sugestão
- ✅ Explique suas decisões se necessário
- ❌ Não leve para o pessoal

---

### ✅ Checklist Day 2

Ao final do Day 2, você deve ter:
- [x] Escolhido uma task adequada
- [x] Criado branch com nomenclatura correta
- [x] Implementado a mudança
- [x] Testado localmente
- [x] Feito commit com mensagem descritiva
- [x] Criado Pull Request
- [x] Respondido a feedback de code review (se houver)

**🎉 Parabéns! Você fez sua primeira contribuição!**

---

## RECURSOS ESSENCIAIS

### Documentação Core

**Must-read (ordem de prioridade):**
1. [02-CHANGELOG.md](./02-CHANGELOG.md) - Histórico de mudanças
2. [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md) - Schema do banco
3. [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md) - Como fazer deploy
4. [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md) - Solução de problemas

**Leia conforme necessário:**
- [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md) - Sistema de score
- [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md) - Controle de acesso
- [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md) - Sistema de áudio IA
- [40-DESIGN-SYSTEM.md](./40-DESIGN-SYSTEM.md) - Design tokens

### Ferramentas Úteis

**VS Code Extensions (recomendadas):**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Supabase (opcional)
- GitLens (opcional)

**Browser DevTools:**
- React Developer Tools
- Redux DevTools (se usar Redux)

### Links Externos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx
- **Vercel Dashboard:** https://vercel.com/dashboard (peça acesso)
- **Produção:** https://app-diagnostico-vendas.vercel.app

---

## NEXT STEPS

### Semana 1

**Objetivos:**
- [ ] Completar 2-3 PRs de nível Starter/Intermediate
- [ ] Ler toda documentação core
- [ ] Participar de daily standup (se houver)
- [ ] Fazer pair programming com alguém do time (1h)

**Explorar:**
- Como funciona sistema de XP
- Como Admin controla evento ao vivo
- Como notificações são enviadas em tempo real
- Como integração Hotmart funciona

---

### Mês 1

**Objetivos:**
- [ ] Assumir ownership de uma feature completa
- [ ] Fazer code review de PRs de outros devs
- [ ] Propor melhoria ou refatoração
- [ ] Documentar algo que estava faltando

**Deep dives (escolha 1-2):**
- Sistema de áudio personalizado (OpenAI + ElevenLabs)
- Sistema de gamification e níveis
- Realtime com Supabase
- Edge Functions do Supabase

---

### Growth Path

**Junior → Mid-level:**
- Dominar stack completo (React + Supabase)
- Fazer deploys independentes
- Resolver bugs complexos
- Mentorar novos devs

**Mid-level → Senior:**
- Arquitetar novas features
- Otimizar performance
- Code review com foco em arquitetura
- Definir padrões do projeto

---

## 📞 PRECISA DE AJUDA?

**Se ficou travado:**
1. Consulte [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)
2. Busque no código: `grep -r "keyword" src/`
3. Pergunte no chat do time
4. Agende pairing com alguém

**Cultura do time:**
- ✅ Perguntas são bem-vindas!
- ✅ "Não sei" é uma resposta válida
- ✅ Pair programming é incentivado
- ✅ Documentação é responsabilidade de todos

---

**Bem-vindo ao time! 🎉**

**Desenvolvido por:** Claude Code + Andre Buric
**Data:** 2026-02-03
**Próxima revisão:** Quando onboarding de próximo dev
