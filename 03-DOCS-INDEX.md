# 03. ÍNDICE DA DOCUMENTAÇÃO

**Última Atualização:** 2026-02-03
**Total de Documentos:** 29 arquivos core + ARCHIVE/

---

## 📖 COMO USAR ESTE ÍNDICE

### Navegação Rápida

- **Novo no projeto?** Comece por → [50-QUICK-START-NEW-DEVS.md](./50-QUICK-START-NEW-DEVS.md)
- **Algo quebrou?** Vá para → [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)
- **Vai fazer deploy?** Siga → [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md)
- **Quer entender o sistema?** Leia → [01-PROJECT-STATUS.md](./01-PROJECT-STATUS.md)

### Estrutura Hierárquica

A documentação usa numeração prefixada para organização:

- **00-09:** Visão geral do projeto
- **10-19:** Features principais
- **20-29:** Integrações externas
- **30-39:** Arquitetura e banco de dados
- **40-49:** Design e UI
- **50-59:** Guias para desenvolvedores

---

## 📂 ESTRUTURA COMPLETA

### 00-09: PROJECT OVERVIEW

#### [01-PROJECT-STATUS.md](./01-PROJECT-STATUS.md)
- **Descrição:** Status atual do projeto, versão, stack tecnológico
- **Quando usar:** Visão geral rápida, onboarding de novos devs
- **Última atualização:** 2026-02-03

#### [02-CHANGELOG.md](./02-CHANGELOG.md)
- **Descrição:** Histórico unificado de mudanças (versões 2.3.0 até 1.0.0)
- **Conteúdo:** Todas as features, fixes, e melhorias desde 27/01/2026
- **Seções:** 9 versões consolidadas (2.3.0, 2.2.0, 2.1.0, 2.0.0, 1.5.0, 1.4.0, 1.3.0, 1.2.0, 1.0.0)
- **Última atualização:** 2026-02-03

#### [03-DOCS-INDEX.md](./03-DOCS-INDEX.md)
- **Descrição:** Este arquivo - navegação centralizada de toda documentação
- **Quando usar:** Encontrar documentação específica rapidamente

---

### 10-19: CORE FEATURES

#### [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md)
- **Descrição:** Sistema de cálculo de score IMPACT e identificação de gargalo
- **Conteúdo:**
  - Fórmula de score: (média Dia 1 + Dia 2) / 6 × 10
  - Lógica de gargalo: valor mínimo + prioridade IMPACT
  - SQL queries de verificação
  - Casos de teste
- **Arquivos relacionados:** `src/hooks/useDiagnosticScore.ts`
- **Última atualização:** 2026-02-03

#### [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md)
- **Descrição:** Sistema de controle de acesso às abas (Preparação, Ao Vivo, Pós-Evento)
- **Conteúdo:**
  - Lógica de liberação/bloqueio automático por data
  - Toggle manual com prioridade máxima
  - Admin bypass completo
  - Interface no Admin
  - Telas de "Aba Bloqueada"
- **Arquivos relacionados:**
  - `src/hooks/useEventState.ts`
  - `src/pages/PreEvento.tsx`
  - `src/pages/AoVivo.tsx`
  - `src/pages/PosEvento.tsx`
- **Migration:** `supabase/migrations/20260203000004_tab_access_control.sql`
- **Última atualização:** 2026-02-03

#### [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md)
- **Descrição:** Sistema completo de áudio personalizado via IA
- **Conteúdo:**
  - Fluxo completo: Survey → OpenAI gpt-4o-mini → ElevenLabs eleven_v3 → GHL API → WhatsApp
  - 2 Workflows GHL (Boas-Vindas + Áudio Personalizado)
  - Integração GHL via API direta (ghl-service.ts) — atualiza custom fields sem depender do workflow
  - Templates WhatsApp aprovados
  - Padrão "ok" para session window
  - Edge Function: generate-audio (13 steps)
  - Troubleshooting extenso
  - FAQ
- **Arquivos relacionados:**
  - `supabase/functions/generate-audio/` (6 arquivos incl. ghl-service.ts)
  - `supabase-migrations-survey-audio-files.sql`
- **Secrets:** OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, GHL_API_KEY
- **Custo:** ~$0.19 por usuário (~$0.005 OpenAI + $0.18 ElevenLabs)
- **Última atualização:** 2026-02-04
- **Tamanho:** ~1500 linhas, 16 seções

#### [13-CHAT-AI-SYSTEM.md](./13-CHAT-AI-SYSTEM.md)
- **Descrição:** Assistente de IA integrado ao chat
- **Status:** A implementar

---

### 20-29: INTEGRATIONS

#### [20-GHL-WORKFLOWS.md](./20-GHL-WORKFLOWS.md)
- **Descrição:** Workflows Go High Level consolidados
- **Status:** A criar (merge de 2 docs)

#### [21-HOTMART-WEBHOOK.md](./21-HOTMART-WEBHOOK.md)
- **Descrição:** Integração webhook Hotmart
- **Status:** A criar

#### [22-WHATSAPP-INTEGRATION.md](./22-WHATSAPP-INTEGRATION.md)
- **Descrição:** Integração WhatsApp via GHL
- **Status:** A criar

---

### 30-39: ARCHITECTURE & DATABASE

#### [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md)
- **Descrição:** Estado atual do schema do banco de dados Supabase
- **Conteúdo:**
  - 8 tabelas documentadas (profiles, purchases, survey_responses, event_state, notifications, survey_audio_files, nps_responses, whatsapp_messages)
  - RLS policies completas
  - SQL function: `is_valid_buyer()`
  - Storage bucket: survey-audios
  - Realtime subscriptions
  - Common queries
  - Migration history (referência, não execução)
- **Quando usar:**
  - Consultar estrutura atual do banco
  - Entender RLS policies
  - Escrever queries complexas
- **⚠️ IMPORTANTE:** Este doc mostra ESTADO ATUAL, não instruções de execução de migrations
- **Última atualização:** 2026-02-03
- **Tamanho:** 838 linhas

#### [31-ARCHITECTURE-OVERVIEW.md](./31-ARCHITECTURE-OVERVIEW.md)
- **Descrição:** Visão geral da arquitetura
- **Status:** A criar

#### [32-SECURITY-VALIDATION.md](./32-SECURITY-VALIDATION.md)
- **Descrição:** Sistema de validação de compras e segurança
- **Status:** A criar

#### [33-AUTHENTICATION-SYSTEM.md](./33-AUTHENTICATION-SYSTEM.md)
- **Descrição:** Sistema de autenticação Supabase
- **Status:** A criar

---

### 40-49: DESIGN & UI

#### [40-DESIGN-SYSTEM.md](./40-DESIGN-SYSTEM.md)
- **Descrição:** Design system, cores, tipografia, componentes
- **Status:** A criar

#### [41-MODAL-PATTERNS.md](./41-MODAL-PATTERNS.md)
- **Descrição:** Padrões de modais e overlays
- **Status:** A criar

---

### 50-59: DEVELOPER GUIDES

#### [50-QUICK-START-NEW-DEVS.md](./50-QUICK-START-NEW-DEVS.md)
- **Descrição:** Guia de onboarding para novos desenvolvedores
- **Conteúdo:**
  - **Day 1 (2h):** Setup completo, ambiente, primeiro run, explorar app
  - **Day 2 (4h):** Primeira contribuição, branch, commit, PR
  - **Resources:** Must-read docs, VS Code extensions, links externos
  - **Next Steps:** Roadmap Semana 1, Mês 1, Growth path
- **Quando usar:**
  - Primeiro dia no projeto
  - Configurar ambiente de dev
  - Entender estrutura do código
- **Última atualização:** 2026-02-03

#### [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)
- **Descrição:** Guia completo de solução de problemas
- **Conteúdo:**
  - **Por Feature:** Audio, Compras, Tabs, Validação, Edge Functions, Frontend
  - **Por Tipo de Erro:** HTTP (401, 403, 404, 500), Database (42703, 23505, 42501), JavaScript
  - **Por Componente:** Supabase, Vercel, OpenAI, ElevenLabs, GHL
  - **Problemas Críticos:** Sistema offline, RLS bloqueando todos, Edge Function falhando
  - **Procedimentos de Emergência:** Rollback frontend/database, liberar acesso manual, desabilitar features
- **Quando usar:**
  - Algo quebrou ou não está funcionando
  - Mensagem de erro apareceu
  - Debugging de problemas complexos
- **Última atualização:** 2026-02-03
- **Tamanho:** 1000+ linhas consolidadas

#### [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md)
- **Descrição:** Guia completo de deployment em produção
- **Conteúdo:**
  - **Supabase CLI Setup:** Instalação, login, link projeto
  - **Database Migrations:** 7 migrations na ordem correta
  - **Edge Functions:** Deploy de hotmart-webhook e generate-audio
  - **Security:** Validation function, RLS policies, manual approval
  - **Hotmart Integration:** Configurar webhook, Thank You Page, compra teste
  - **Frontend (Vercel):** Deploy automático, env vars, verificação
  - **Testing & Validation:** Unit tests, integration tests, E2E
  - **Monitoring:** Logs Supabase, database queries, Vercel logs
  - **Rollback:** Procedures de rollback frontend, database, edge functions
  - **Troubleshooting:** Erros comuns database, edge functions, frontend, Hotmart
  - **Support:** Manual approval, atualizar compras, emergency rollback
- **Quando usar:**
  - Fazer deploy inicial
  - Executar migrations
  - Deploy de Edge Functions
  - Configurar integrações
  - Preparar para produção
- **Última atualização:** 2026-02-03
- **Tamanho:** 1229 linhas, 12 seções

---

## 🗄️ ARCHIVE (Arquivos Históricos)

### Estrutura

```
ARCHIVE/
├── MIGRATIONS-EXECUTED/      # Migrations já aplicadas (referência)
├── COMPLETED-TASKS/           # Tasks e summaries finalizadas
├── OLD-CHANGELOGS/            # Changelogs separados (pré-merge)
├── OLD-PROMPTS/               # Prompts antigos de IA
└── OLD-PLANNING/              # Planejamentos obsoletos
```

### Quando consultar ARCHIVE

- **Histórico de migrations:** Ver ordem de execução e detalhes técnicos
- **Tasks completadas:** Entender contexto de implementações passadas
- **Changelogs antigos:** Ver histórico detalhado antes do merge
- **Prompts antigos:** Referência de como IA foi configurada inicialmente

### Navegação

Ver: [ARCHIVE/_README.md](./ARCHIVE/_README.md) (a ser criado)

---

## 🔍 BUSCA RÁPIDA POR TÓPICO

### Áudio Personalizado
- Sistema completo: [12-AUDIO-SYSTEM.md](./12-AUDIO-SYSTEM.md)
- Troubleshooting: [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md#21-sistema-de-audio)
- Deployment: [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md#42-audio-generation-function)

### Banco de Dados
- Schema atual: [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md)
- Migrations: [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md#3-database-migrations)
- Troubleshooting DB: [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md#32-erros-de-database)

### Compras e Validação
- Hotmart webhook: Ver 53-DEPLOYMENT-GUIDE.md seção 6
- Validação: [30-SUPABASE-SCHEMA-REFERENCE.md](./30-SUPABASE-SCHEMA-REFERENCE.md#41-is_valid_buyer)
- Troubleshooting: [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md#22-sistema-de-compras-hotmart)

### Controle de Acesso
- Tab Access Control: [11-TAB-ACCESS-CONTROL.md](./11-TAB-ACCESS-CONTROL.md)
- Troubleshooting: [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md#23-controle-de-acesso-as-abas)

### Score e Gargalo
- Cálculo completo: [10-DIAGNOSTIC-SCORE-CALCULATION.md](./10-DIAGNOSTIC-SCORE-CALCULATION.md)
- Implementação: `src/hooks/useDiagnosticScore.ts`

### Deployment
- Guia completo: [53-DEPLOYMENT-GUIDE.md](./53-DEPLOYMENT-GUIDE.md)
- Checklist: Ver seção "CHECKLIST FINAL DE DEPLOY"
- Troubleshooting: [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md#11-erros-comuns-database)

### Onboarding
- Quick start: [50-QUICK-START-NEW-DEVS.md](./50-QUICK-START-NEW-DEVS.md)
- Status do projeto: [01-PROJECT-STATUS.md](./01-PROJECT-STATUS.md)
- Changelog: [02-CHANGELOG.md](./02-CHANGELOG.md)

---

## 📊 ESTATÍSTICAS DA DOCUMENTAÇÃO

### Documentos Principais
- **Total:** 29 arquivos core
- **Consolidados (merges):** 10+ documentos
- **Novos guias:** 3 (Quick Start, Troubleshooting, Docs Index)
- **Linha de código docs:** ~10.000+ linhas

### Cobertura
- ✅ **100%** - Core features documentadas
- ✅ **100%** - Troubleshooting consolidado
- ✅ **100%** - Deployment documentado
- ✅ **90%** - Integrações documentadas
- ⏳ **60%** - Design system (a implementar)

### Manutenção
- **Última grande reorganização:** 2026-02-03
- **Sistema de versionamento:** Hierárquico (00-59)
- **Update frequency:** A cada feature/fix major

---

## 🎯 ROADMAP DE DOCUMENTAÇÃO

### Próximas Adições (Prioridade)

**Alta:**
- [ ] 20-GHL-WORKFLOWS.md - Consolidar workflows GHL
- [ ] 32-SECURITY-VALIDATION.md - Sistema de validação completo
- [ ] 31-ARCHITECTURE-OVERVIEW.md - Diagrama de arquitetura

**Média:**
- [ ] 21-HOTMART-WEBHOOK.md - Detalhes webhook Hotmart
- [ ] 40-DESIGN-SYSTEM.md - Componentes UI
- [ ] 13-CHAT-AI-SYSTEM.md - Assistente IA

**Baixa:**
- [ ] 22-WHATSAPP-INTEGRATION.md - GHL + WhatsApp
- [ ] 41-MODAL-PATTERNS.md - Padrões de UI
- [ ] 33-AUTHENTICATION-SYSTEM.md - Auth Supabase

### Melhorias Futuras

- **Diagramas visuais:** Adicionar diagramas de fluxo com Mermaid
- **Videos/GIFs:** Tutoriais em vídeo para setup
- **API Reference:** Documentação auto-gerada de funções
- **Exemplos de código:** Mais snippets práticos
- **Troubleshooting interativo:** Ferramenta de diagnóstico

---

## 🤝 CONTRIBUINDO PARA A DOCUMENTAÇÃO

### Como Adicionar Nova Documentação

1. **Escolha o número correto:**
   - Overview (00-09), Features (10-19), Integrations (20-29), etc.
   - Use próximo número disponível na categoria

2. **Nomeie o arquivo:**
   - Formato: `XX-NOME-DESCRITIVO.md`
   - Exemplo: `14-GAMIFICATION-SYSTEM.md`

3. **Template básico:**
```markdown
# XX. TÍTULO DO DOCUMENTO

**Última Atualização:** YYYY-MM-DD
**Status:** [Completo/Em Progresso/Planejado]

---

## 📋 ÍNDICE
[Suas seções aqui]

---

## 1. VISÃO GERAL
[Descrição]

---

[Conteúdo]

---

**Desenvolvido por:** [Nome]
**Data:** YYYY-MM-DD
```

4. **Adicione ao índice:**
   - Edite este arquivo (03-DOCS-INDEX.md)
   - Adicione link e descrição na seção apropriada

5. **Commit:**
```bash
git add XX-NOME-DESCRITIVO.md 03-DOCS-INDEX.md
git commit -m "docs: Add XX-NOME-DESCRITIVO documentation"
```

### Diretrizes de Estilo

- **Linguagem:** Português (Brasil)
- **Tom:** Técnico mas acessível
- **Estrutura:** Sempre ter índice navegável
- **Exemplos:** Sempre incluir código real, não pseudocódigo
- **Updates:** Atualizar "Última Atualização" ao modificar
- **Links:** Usar paths relativos (`./arquivo.md`)
- **Tamanho:** Não há limite, mas considere split se > 2000 linhas

---

## 📞 SUPORTE

### Se não encontrar o que procura

1. **Busque no Changelog:** Pode estar documentado em [02-CHANGELOG.md](./02-CHANGELOG.md)
2. **Verifique Troubleshooting:** [52-TROUBLESHOOTING-GUIDE.md](./52-TROUBLESHOOTING-GUIDE.md)
3. **Consulte ARCHIVE:** Pode ter documentação antiga relevante
4. **Pergunte ao time:** Use canais internos
5. **Crie issue:** Se é gap real na documentação

### Feedback

Encontrou erro ou falta algo? Abra issue ou PR:
- **GitHub:** https://github.com/[repo]/issues
- **Contato:** [email ou slack]

---

**Desenvolvido por:** Claude Code + Andre Buric
**Data:** 2026-02-03
**Status:** ✅ Completo e Atualizado
**Última Reorganização:** 2026-02-03 (35 docs → 29 core + ARCHIVE)
