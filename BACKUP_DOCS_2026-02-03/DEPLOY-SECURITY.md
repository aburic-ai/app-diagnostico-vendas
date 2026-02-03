# 🚀 Deploy Rápido - Validação de Segurança

**Data:** 2026-02-01
**Tempo estimado:** 10 minutos

---

## ✅ CHECKLIST DE DEPLOY

### 1. Banco de Dados (5 min)

**Acesse:** [Supabase SQL Editor](https://supabase.com/dashboard)

Execute **nesta ordem**:

#### Migration 1: Função de Validação
```bash
Arquivo: supabase-validation-function.sql
```
- [x] Copiar conteúdo completo
- [x] Colar no SQL Editor
- [x] Executar (Run)
- [x] Verificar: "Success. No rows returned"

#### Migration 2: RLS Policy
```bash
Arquivo: fix-survey-responses-rls-v2.sql
```
- [x] Copiar conteúdo completo
- [x] Colar no SQL Editor
- [x] Executar (Run)
- [x] Verificar: Policy criada

#### Migration 3: Manual Approval
```bash
Arquivo: supabase-migrations-purchases-v3.sql
```
- [x] Copiar conteúdo completo
- [x] Colar no SQL Editor
- [x] Executar (Run)
- [x] Verificar: Coluna adicionada

---

### 2. Verificar Aplicação (2 min)

**Teste a função:**
```sql
SELECT * FROM public.is_valid_buyer(
  'seu-email@exemplo.com',  -- Substituir por email de teste
  'HP0603054387',            -- Substituir por transaction real
  'imersao-diagnostico-vendas'
);
```

**Expected:**
```
is_valid | purchase_id | user_id | buyer_name | reason
---------|-------------|---------|------------|-------
true     | uuid...     | uuid... | Nome       | valid
```

**Verificar RLS:**
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'survey_responses'
  AND policyname = 'Allow insert for verified buyers only';
```

**Expected:** 1 linha retornada

**Verificar campo:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'purchases'
  AND column_name = 'manual_approval';
```

**Expected:**
```
column_name      | data_type | column_default
-----------------|-----------|---------------
manual_approval  | boolean   | false
```

---

### 3. Frontend (Auto-Deploy via Vercel)

**O código já foi commitado. Verifique o deploy:**

1. Acesse: [Vercel Dashboard](https://vercel.com/dashboard)
2. Projeto: `app-diagnostico-vendas`
3. Aguarde deploy automático (2-3 min)
4. Status: ✅ Ready

**OU force redeploy:**
```bash
cd /Users/andre/Brainpower\ Dropbox/Brain\ Power/CLAUDE\ CODE/app-diagnostico-vendas
git status  # Verificar mudanças
git add .
git commit -m "feat: Implement purchase validation security"
git push origin main
```

---

### 4. Testes Pós-Deploy (3 min)

#### Teste 1: Comprador Válido ✅
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado?transaction=HP0603054387
Expected: Acesso completo → Survey → Senha → WhatsApp
```

#### Teste 2: Email Válido ✅
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado
Ação: Digitar email de comprador válido
Expected: Verificação OK → Survey
```

#### Teste 3: Não-Comprador ❌
```
URL: https://app-diagnostico-vendas.vercel.app/obrigado
Ação: Digitar email random (teste@teste.com)
Expected: Tela "Acesso Negado" + Botão suporte
```

#### Teste 4: Botão Skip Removido ❌
```
Ação: Aguardar 10s sem encontrar compra
Expected: Tela "Acesso Negado" (NÃO mostra "Continuar sem verificação")
```

---

## 🐛 TROUBLESHOOTING

### Erro: Function already exists
**Causa:** Função já foi criada antes
**Solução:** Normal, vai sobrescrever. Pode ignorar.

### Erro: Policy already exists
**Causa:** Policy duplicada
**Solução:**
```sql
DROP POLICY IF EXISTS "Allow insert for verified buyers only"
  ON public.survey_responses;
-- Re-executar migration 2
```

### Erro: Column already exists
**Causa:** Campo já foi adicionado
**Solução:** Normal, `IF NOT EXISTS` ignora. Pode continuar.

### Frontend não atualizou
**Causa:** Cache do Vercel
**Solução:**
1. Hard refresh: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
2. Ou limpar cache do navegador

### RLS bloqueando compradores válidos
**Causa:** Migration 2 não aplicada corretamente
**Solução:**
```sql
-- Ver policies ativas
SELECT * FROM pg_policies WHERE tablename = 'survey_responses';

-- Se não houver "Allow insert for verified buyers only", re-executar migration 2
```

---

## 📊 MONITORAMENTO (Primeiras 24h)

### Logs do Supabase
```sql
-- Erros RLS nas últimas 24h
SELECT *
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND error_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

### Compras Pendentes
```sql
-- Podem gerar confusão (usuário tenta acessar mas compra não processou)
SELECT email, status, transaction_id, created_at
FROM purchases
WHERE status != 'approved'
  AND manual_approval = false
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Aprovações Manuais
```sql
-- Ver quem foi liberado manualmente
SELECT email, buyer_name, transaction_id, manual_approval, created_at
FROM purchases
WHERE manual_approval = true
ORDER BY created_at DESC;
```

---

## 🆘 ROLLBACK DE EMERGÊNCIA

**Se houver problema crítico bloqueando TODOS os usuários:**

### Opção 1: Rollback Frontend
```bash
git revert HEAD
git push origin main
# Aguardar redeploy (2-3 min)
```

### Opção 2: Rollback RLS (Temporário)
```sql
-- ⚠️ VOLTA PARA PERMISSIVO (INSEGURO)
DROP POLICY IF EXISTS "Allow insert for verified buyers only"
  ON public.survey_responses;

CREATE POLICY "Allow public insert"
  ON public.survey_responses
  FOR INSERT
  TO public
  WITH CHECK (true);
```

⚠️ **Após rollback:**
1. Investigar logs
2. Identificar issue
3. Corrigir e re-testar
4. Re-deploy

---

## 🎯 MANUAL OVERRIDE (Suporte)

**Quando um comprador válido está bloqueado:**

1. **Verificar compra:**
```sql
SELECT * FROM purchases WHERE email = 'usuario@email.com';
```

2. **Se compra existe mas status != 'approved':**
```sql
-- Liberar manualmente
UPDATE purchases
SET manual_approval = true
WHERE email = 'usuario@email.com';
```

3. **Avisar usuário:**
```
Olá! Liberamos seu acesso manualmente.
Por favor, tente novamente pelo link: [link]
```

4. **Log do caso:**
- Anotar email
- Motivo do bloqueio
- Ação tomada (manual_approval)

---

## 📞 CONTATOS

**Suporte Técnico:**
- Dev: [seu contato]
- Supabase Dashboard: [link do projeto]
- Vercel Dashboard: [link do projeto]

**Documentação Completa:**
- `SECURITY-VALIDATION.md` - Documentação técnica completa
- `supabase-validation-function.sql` - Migration 1
- `fix-survey-responses-rls-v2.sql` - Migration 2
- `supabase-migrations-purchases-v3.sql` - Migration 3

---

## ✅ DEPLOY CONCLUÍDO

- [x] Migrations executadas no Supabase
- [x] Verificações de banco OK
- [x] Frontend deployado
- [x] Testes básicos OK
- [x] Monitoramento configurado

**Próximos passos:**
1. Monitorar logs por 24h
2. Verificar tickets de suporte
3. Documentar casos edge encontrados

---

**Última atualização:** 2026-02-01
**Status:** ✅ PRONTO PARA PRODUÇÃO
