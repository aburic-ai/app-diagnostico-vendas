# 📦 ARCHIVE - Documentação Histórica

**Data de Criação:** 2026-02-03
**Propósito:** Armazenar documentação obsoleta, completada ou consolidada

---

## 📋 O QUE É O ARCHIVE?

Este diretório contém documentação que **NÃO** deve mais ser usada como referência principal, mas é mantida para:

- **Histórico:** Registro de como o projeto evoluiu
- **Referência:** Consultar detalhes de implementações passadas
- **Auditoria:** Rastrear decisões técnicas anteriores
- **Contexto:** Entender por que mudanças foram feitas

⚠️ **IMPORTANTE:** Documentação no ARCHIVE pode estar **desatualizada** ou **obsoleta**. Sempre consulte a documentação principal na raiz do projeto.

---

## 📂 ESTRUTURA

```
ARCHIVE/
├── MIGRATIONS-EXECUTED/      # Migrations já aplicadas (não executar novamente)
├── COMPLETED-TASKS/           # Tasks e work summaries finalizadas
├── OLD-CHANGELOGS/            # Changelogs separados (pré-merge)
├── OLD-PROMPTS/               # Prompts antigos de IA (não usar)
└── OLD-PLANNING/              # Planejamentos, deploys e guides consolidados
```

---

## 🗂️ CONTEÚDO POR SUBPASTA

### MIGRATIONS-EXECUTED/

**Arquivos:**
- `GUIA-MIGRATIONS-ORDEM-CORRETA.md` - Guia de execução de migrations (substituído por [30-SUPABASE-SCHEMA-REFERENCE.md](../30-SUPABASE-SCHEMA-REFERENCE.md))
- `MELHORIAS-COMPLETAS.md` - Documentação de melhorias antigas
- `PLANO_SUPABASE.md` - Planejamento inicial do banco (se existir)

**Por que foi arquivado:**
- Migrations já foram **100% executadas**
- **GUIA-MIGRATIONS** foi transformado em **30-SUPABASE-SCHEMA-REFERENCE.md** (estado atual do banco)
- Não há necessidade de executar migrations novamente

**Quando consultar:**
- Entender histórico de mudanças no banco
- Ver ordem de execução das migrations
- Debugar problemas relacionados a schema antigo

**⚠️ NÃO EXECUTE:** Migrations deste diretório já foram aplicadas!

---

### COMPLETED-TASKS/

**Arquivos:**
- `TASK-2-COMPLETO.md` - Task 2 finalizada
- `TASK-4-VERIFICACAO-PERSISTENCIA.md` - Task 4: Verificação de persistência
- `TAREFAS-CONCLUIDAS.md` - Lista de tarefas completadas
- `RESUMO-FINAL-COMPLETO.md` - Resumo final de implementação

**Por que foi arquivado:**
- Tasks **100% completadas**
- Funcionalidades já estão em produção
- Documentação técnica migrada para docs principais

**Quando consultar:**
- Entender contexto de uma implementação específica
- Ver detalhes técnicos de como feature foi implementada
- Rastrear decisões de design tomadas durante a task

**Referência:** Para status atual do projeto, veja [01-PROJECT-STATUS.md](../01-PROJECT-STATUS.md)

---

### OLD-CHANGELOGS/

**Arquivos:**
- `CHANGELOG-2026-02-02.md` - Changelog Parte A (Dia 02/02)
- `CHANGELOG-2026-02-02-B.md` - Changelog Parte B (Dia 02/02)
- `CHANGELOG.md` - Changelog original (se existir)

**Por que foi arquivado:**
- Changelogs **consolidados** em um único arquivo: [02-CHANGELOG.md](../02-CHANGELOG.md)
- Versões antigas separadas não são mais necessárias
- Histórico completo está no novo changelog unificado

**Quando consultar:**
- Ver detalhes específicos de mudanças em 02/02/2026
- Comparar versões antigas vs consolidada
- Auditoria de mudanças específicas

**Referência:** Para changelog atual, veja [02-CHANGELOG.md](../02-CHANGELOG.md)

---

### OLD-PROMPTS/

**Arquivos:**
- `PROMPT-ASSISTENTE*.md` - Prompts antigos do assistente IA
- `PROMPT-OPENAI*.md` - Configurações antigas OpenAI
- (Se houver mais prompts legados)

**Por que foi arquivado:**
- Prompts **obsoletos** ou substituídos
- Nova configuração está em [12-AUDIO-SYSTEM.md](../12-AUDIO-SYSTEM.md)
- Versões antigas não devem ser usadas

**Quando consultar:**
- Comparar prompts antigos vs novos
- Entender evolução do sistema de IA
- Debugar problemas relacionados a mudanças de prompt

**Referência:** Para prompts atuais, veja [12-AUDIO-SYSTEM.md](../12-AUDIO-SYSTEM.md) seção 6

---

### OLD-PLANNING/

**Arquivos:**
- `FLUXO_AUDIO_BOASVINDAS.md` - Fluxo antigo de áudio (consolidado)
- `IMPLEMENTACAO-AUDIO-RESUMO.md` - Resumo de implementação áudio (consolidado)
- `GHL-WORKFLOW-2-VARIAVEIS.md` - Variáveis workflow 2 (consolidado)
- `GUIA-SETUP-GHL-AUDIO.md` - Setup GHL áudio (consolidado)
- `DEPLOY-SECURITY.md` - Deploy segurança (consolidado)
- `DEPLOY-WEBHOOK.md` - Deploy webhook (consolidado)
- `DEPLOY-WEBHOOK-HOTMART.md` - Deploy Hotmart (consolidado)

**Por que foi arquivado:**
- Documentação **consolidada** em docs principais
- 4 docs de áudio → [12-AUDIO-SYSTEM.md](../12-AUDIO-SYSTEM.md)
- 3 docs de deploy → [53-DEPLOYMENT-GUIDE.md](../53-DEPLOYMENT-GUIDE.md)
- Versões separadas não são mais necessárias

**Quando consultar:**
- Ver detalhes específicos de uma implementação antiga
- Comparar versão consolidada vs originais
- Entender histórico de mudanças no planejamento

**Referência:**
- Áudio: [12-AUDIO-SYSTEM.md](../12-AUDIO-SYSTEM.md)
- Deploy: [53-DEPLOYMENT-GUIDE.md](../53-DEPLOYMENT-GUIDE.md)

---

## 🔍 COMO USAR O ARCHIVE

### Cenário 1: Preciso entender como feature X foi implementada

1. **Primeiro:** Consulte documentação principal (raiz do projeto)
   - [03-DOCS-INDEX.md](../03-DOCS-INDEX.md) para encontrar doc relevante

2. **Se não encontrar:** Procure em `ARCHIVE/COMPLETED-TASKS/`
   - Pode ter contexto adicional na task original

3. **Exemplo:**
   ```bash
   # Buscar "persistência" nas tasks completadas
   grep -r "persistência" ARCHIVE/COMPLETED-TASKS/
   ```

---

### Cenário 2: Migration falhou, preciso entender o que era esperado

1. **Consulte:** `ARCHIVE/MIGRATIONS-EXECUTED/GUIA-MIGRATIONS-ORDEM-CORRETA.md`
   - Ver ordem de execução
   - Ver resultado esperado de cada migration

2. **Compare:** Com estado atual do banco via [30-SUPABASE-SCHEMA-REFERENCE.md](../30-SUPABASE-SCHEMA-REFERENCE.md)

3. **Identifique:** Diferença entre esperado vs atual

---

### Cenário 3: Changelog não tem detalhes suficientes de uma data específica

1. **Consulte:** `ARCHIVE/OLD-CHANGELOGS/CHANGELOG-2026-02-02.md`
   - Changelog antigo tinha mais detalhes por sessão

2. **Compare:** Com [02-CHANGELOG.md](../02-CHANGELOG.md) consolidado

3. **Resultado:** Entendimento completo das mudanças

---

## ⚠️ AVISOS IMPORTANTES

### NÃO Faça:

❌ **NÃO** execute migrations de `MIGRATIONS-EXECUTED/` - já foram aplicadas!
❌ **NÃO** use prompts de `OLD-PROMPTS/` - estão obsoletos
❌ **NÃO** siga guides de `OLD-PLANNING/` - foram consolidados

### FAÇA:

✅ **CONSULTE** para contexto e histórico
✅ **COMPARE** versões antigas vs atuais
✅ **ENTENDA** evolução do projeto
✅ **REFERENCIE** decisões técnicas passadas

---

## 📊 ESTATÍSTICAS

**Total de arquivos arquivados:** ~15
**Data do arquivamento:** 2026-02-03
**Motivo:** Grande reorganização da documentação

### Breakdown:
- **MIGRATIONS-EXECUTED:** 2-3 arquivos
- **COMPLETED-TASKS:** 4 arquivos
- **OLD-CHANGELOGS:** 2-3 arquivos
- **OLD-PROMPTS:** 0-2 arquivos (se houver)
- **OLD-PLANNING:** 7 arquivos

---

## 🗑️ POLÍTICA DE RETENÇÃO

### Quando remover do ARCHIVE

Arquivos podem ser deletados do ARCHIVE após:

1. **6 meses** sem consulta (low priority)
2. **1 ano** para migrations e tasks completadas
3. **Nunca** para decisões arquiteturais importantes

### Como decidir se pode deletar

Pergunte-se:
- Alguém consultou este arquivo nos últimos 6 meses?
- Existe referência a este arquivo em docs principais?
- Há contexto histórico valioso que pode ser perdido?
- Decisões técnicas importantes estão documentadas aqui?

**Se SIM a qualquer pergunta:** Mantenha no ARCHIVE
**Se NÃO a todas:** Considere remover (mas faça backup primeiro!)

---

## 📚 DOCUMENTAÇÃO PRINCIPAL

Para documentação **ativa e atualizada**, sempre consulte:

### Índice Central
- [03-DOCS-INDEX.md](../03-DOCS-INDEX.md) - Navegação completa

### Guias Essenciais
- [50-QUICK-START-NEW-DEVS.md](../50-QUICK-START-NEW-DEVS.md) - Onboarding
- [52-TROUBLESHOOTING-GUIDE.md](../52-TROUBLESHOOTING-GUIDE.md) - Solução de problemas
- [53-DEPLOYMENT-GUIDE.md](../53-DEPLOYMENT-GUIDE.md) - Deploy em produção

### Features Principais
- [10-DIAGNOSTIC-SCORE-CALCULATION.md](../10-DIAGNOSTIC-SCORE-CALCULATION.md) - Score IMPACT
- [11-TAB-ACCESS-CONTROL.md](../11-TAB-ACCESS-CONTROL.md) - Controle de acesso
- [12-AUDIO-SYSTEM.md](../12-AUDIO-SYSTEM.md) - Sistema de áudio IA

### Arquitetura
- [30-SUPABASE-SCHEMA-REFERENCE.md](../30-SUPABASE-SCHEMA-REFERENCE.md) - Schema do banco
- [01-PROJECT-STATUS.md](../01-PROJECT-STATUS.md) - Status do projeto
- [02-CHANGELOG.md](../02-CHANGELOG.md) - Histórico de mudanças

---

## 🤝 CONTRIBUINDO

### Adicionar arquivo ao ARCHIVE

```bash
# 1. Mover arquivo para subpasta apropriada
mv ARQUIVO-ANTIGO.md ARCHIVE/SUBPASTA/

# 2. Atualizar este README se necessário

# 3. Commit
git add ARCHIVE/
git commit -m "docs: Archive ARQUIVO-ANTIGO.md (motivo)"
```

### Motivos válidos para arquivar

- ✅ Documentação foi **consolidada** em outro arquivo
- ✅ Feature foi **completada** e documentada em doc principal
- ✅ Migration foi **100% executada** e não precisa ser refeita
- ✅ Planejamento foi **completado** e resultado está em produção
- ✅ Prompt foi **substituído** por versão nova

### Motivos **inválidos** para arquivar

- ❌ "Documento muito grande" (considere split ao invés de arquivar)
- ❌ "Não sei onde colocar" (pergunte ao time)
- ❌ "Parece antigo mas não tenho certeza" (verifique antes)

---

## 📞 DÚVIDAS

**Se você não tem certeza se deve consultar ARCHIVE ou documentação principal:**

1. **Comece sempre** pela documentação principal: [03-DOCS-INDEX.md](../03-DOCS-INDEX.md)
2. **Se não encontrar** o que precisa, busque no ARCHIVE
3. **Se ainda não encontrar**, pergunte ao time ou abra issue

**Encontrou informação importante no ARCHIVE que deveria estar na documentação principal?**
- Abra issue ou PR para migrar o conteúdo relevante!

---

**Criado por:** Claude Code + Andre Buric
**Data:** 2026-02-03
**Status:** ✅ Completo
**Última atualização:** 2026-02-03
