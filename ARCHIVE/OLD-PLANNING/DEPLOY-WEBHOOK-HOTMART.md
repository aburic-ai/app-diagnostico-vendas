# 🚀 DEPLOY WEBHOOK HOTMART - Passo a Passo

**Data:** 2026-01-31
**Objetivo:** Fazer deploy da Edge Function do webhook Hotmart para processar compras automaticamente

---

## ✅ CHECKLIST

- [ ] 1. Executar SQL migrations no Supabase
- [ ] 2. Instalar Supabase CLI
- [ ] 3. Fazer login e linkar projeto
- [ ] 4. Configurar secrets (variáveis de ambiente)
- [ ] 5. Deploy da Edge Function
- [ ] 6. Testar webhook localmente
- [ ] 7. Configurar webhook na Hotmart
- [ ] 8. Fazer compra teste de R$ 1
- [ ] 9. Validar fluxo completo

---

## 📋 PASSO 1: EXECUTAR SQL NO SUPABASE

1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase-migrations-purchases.sql`
6. Cole no editor
7. Clique em **Run** (ou Ctrl/Cmd + Enter)
8. Aguarde mensagem de sucesso

**Resultado esperado:**
- ✅ Campo `refunded_at` adicionado em `purchases`
- ✅ Constraint `UNIQUE(transaction_id)` criado
- ✅ 6 índices criados
- ✅ Tabela `nps_responses` criada

---

## 📋 PASSO 2: INSTALAR SUPABASE CLI

### macOS
```bash
brew install supabase/tap/supabase
```

### Windows
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux
```bash
brew install supabase/tap/supabase
```

**Verificar instalação:**
```bash
supabase --version
```

---

## 📋 PASSO 3: LOGIN E LINKAR PROJETO

### 3.1. Fazer login
```bash
supabase login
```

Isso abrirá o navegador para autenticação. Faça login com sua conta Supabase.

### 3.2. Obter Project Reference ID

1. Vá no Supabase Dashboard
2. Abra seu projeto
3. Vá em **Settings** → **General**
4. Copie o **Reference ID** (exemplo: `abcdefghijklmnop`)

### 3.3. Linkar projeto local

**IMPORTANTE:** Execute este comando **DENTRO da pasta do projeto**:

```bash
cd "/Users/andre/Brainpower Dropbox/Brain Power/CLAUDE CODE/app-diagnostico-vendas"

supabase link --project-ref [seu-project-id]
```

Substitua `[seu-project-id]` pelo Reference ID copiado acima.

**Resultado esperado:**
```
Finished supabase link.
```

---

## 📋 PASSO 4: CONFIGURAR SECRETS

### 4.1. Obter Hottok (Secret) da Hotmart

1. Acesse o painel da Hotmart: https://app.hotmart.com
2. Vá em **Ferramentas** → **Webhooks**
3. Procure por **"Hottok"** ou **"Token de Segurança"**
4. Copie o valor (exemplo: `abc123xyz789`)

**OU** crie um secret temporário para testes:
```bash
# Para testes, pode usar qualquer valor
HOTTOK="test-secret-hotmart-2026"
```

### 4.2. Configurar secret no Supabase

```bash
supabase secrets set HOTMART_WEBHOOK_SECRET="[seu-hottok-aqui]"
```

**Exemplo:**
```bash
supabase secrets set HOTMART_WEBHOOK_SECRET="test-secret-hotmart-2026"
```

**Verificar secrets configurados:**
```bash
supabase secrets list
```

---

## 📋 PASSO 5: DEPLOY DA EDGE FUNCTION

### 5.1. Deploy

```bash
supabase functions deploy hotmart-webhook
```

**Resultado esperado:**
```
Deploying hotmart-webhook (project ref: [seu-project-id])
Bundled hotmart-webhook in 450ms
Deployed hotmart-webhook to:
  https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook
```

**COPIE A URL** gerada! Você vai precisar dela para configurar na Hotmart.

### 5.2. Verificar logs

```bash
supabase functions logs hotmart-webhook
```

Ou em tempo real:
```bash
supabase functions logs hotmart-webhook --tail
```

---

## 📋 PASSO 6: TESTAR WEBHOOK LOCALMENTE

### 6.1. Preparar payload de teste

Crie um arquivo `test-payload.json`:

```json
{
  "event": "PURCHASE_COMPLETE",
  "data": {
    "transaction": "TEST-001",
    "product": {
      "id": 123456,
      "name": "Diagnóstico PDF"
    },
    "buyer": {
      "email": "teste@exemplo.com",
      "name": "João Teste"
    },
    "purchase": {
      "price": {
        "value": 1.00,
        "currency_code": "BRL"
      },
      "approved_date": 1706745600000
    }
  }
}
```

### 6.2. Enviar teste

```bash
curl -X POST 'https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook' \
  -H 'Content-Type: application/json' \
  -H 'X-Hotmart-Hottok: test-secret-hotmart-2026' \
  --data @test-payload.json
```

**Substitua** `[seu-projeto]` pela URL real da sua Edge Function.

### 6.3. Verificar resultado

**Espere retorno:**
```json
{
  "success": true,
  "result": {
    "user_id": "...",
    "product": "diagnostico-pdf",
    "xp_awarded": 40,
    "total_xp": 40
  }
}
```

**Ver logs:**
```bash
supabase functions logs hotmart-webhook
```

**Verificar no Supabase Dashboard:**
1. Vá em **Table Editor**
2. Abra a tabela `purchases`
3. Deve aparecer um registro com `transaction_id = "TEST-001"`
4. Abra a tabela `profiles`
5. Deve ter um perfil com `email = "teste@exemplo.com"` e `xp = 40`

---

## 📋 PASSO 7: CONFIGURAR WEBHOOK NA HOTMART

### 7.1. Acessar painel Hotmart

1. Vá em https://app.hotmart.com
2. Selecione o produto (ou crie a oferta de R$ 1)
3. Vá em **Ferramentas** → **Webhooks**

### 7.2. Adicionar webhook

1. Clique em **Adicionar Webhook** ou **Configurar**
2. **URL do Webhook:**
   ```
   https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook
   ```
   (Usar a URL que você copiou no Passo 5.1)

3. **Eventos para monitorar:**
   - ✅ Compra aprovada (`PURCHASE_COMPLETE`)
   - ✅ Reembolso (`PURCHASE_REFUNDED`)
   - ✅ Compra cancelada (`PURCHASE_CANCELED`)

4. **Salvar**

### 7.3. Testar webhook da Hotmart

Alguns painéis da Hotmart têm opção **"Testar Webhook"**. Se tiver, clique e veja se recebe sucesso.

---

## 📋 PASSO 8: FAZER COMPRA TESTE

### 8.1. Criar oferta de R$ 1 na Hotmart

1. Crie uma oferta de teste por R$ 1,00
2. **Thank You Page (URL de Redirecionamento):**
   ```
   https://app-diagnostico-vendas.vercel.app/obrigado?transaction={transaction_id}
   ```
   **IMPORTANTE:** Use exatamente `transaction` (não `tx`)

3. Copie o link de compra

### 8.2. Fazer a compra

1. Abra o link em uma aba anônima
2. Preencha com um **email de teste** (pode ser o seu mesmo)
3. Complete a compra (R$ 1,00)

### 8.3. Aguardar processamento

**Tempo esperado:** 5-30 segundos

**Hotmart vai:**
1. Processar pagamento
2. **ENVIAR webhook** → Edge Function processa → Insere em `purchases` + dá XP
3. **REDIRECIONAR** para `/obrigado?transaction=HP123456`

---

## 📋 PASSO 9: VALIDAR FLUXO COMPLETO

### 9.1. Verificar logs da Edge Function

```bash
supabase functions logs hotmart-webhook --tail
```

**O que você deve ver:**
```
📦 Processing purchase: teste@exemplo.com | Diagnóstico PDF
✓ Product detected: diagnostico-pdf (+40 XP)
👤 Creating new user: teste@exemplo.com
✓ Purchase recorded: HP123456
✅ Purchase complete! teste@exemplo.com | diagnostico-pdf | +40 XP | Total: 40 XP
```

### 9.2. Verificar no Supabase Dashboard

**Tabela `purchases`:**
- Deve ter registro com seu `transaction_id` (HP...)
- `product_slug` = `diagnostico-pdf`
- `status` = `approved`
- `price` = `1.00`

**Tabela `profiles`:**
- Deve ter perfil com seu email
- `xp` = `40`
- `completed_steps` contém `purchase-pdf-diagnosis`

### 9.3. Verificar na Thank You Page

A página `/obrigado` deve:
1. **Mostrar:** "COMPRA IDENTIFICADA!" (em verde)
2. **Exibir:** Pesquisa de calibragem (8 perguntas)
3. Ao finalizar → Criar senha → Redirecionar para `/pre-evento`

### 9.4. Verificar XP no app

Faça login no app com o email de teste:
1. Acesse: https://app-diagnostico-vendas.vercel.app
2. Login com email + senha criada
3. Vá em `/pre-evento`
4. **XP badge no topo** deve mostrar **40 XP**
5. Step "Diagnóstico PDF" deve estar marcado como **"COMPLETO"** (verde)

---

## ✅ SUCESSO!

Se todos os passos acima funcionaram, o webhook Hotmart está 100% integrado! 🎉

**Agora você pode:**
- Criar as ofertas reais (PDF, Aulas, IMPACT)
- Configurar o mesmo webhook para todos os produtos
- Cada compra vai automaticamente dar XP ao usuário
- Reembolsos vão reverter o XP automaticamente

---

## 🐛 TROUBLESHOOTING

### Erro: "Invalid signature"
- Verifique se o `HOTMART_WEBHOOK_SECRET` está correto
- Confira se configurou o secret: `supabase secrets list`

### Erro: "Purchase insert failed"
- Execute as migrations SQL novamente
- Verifique se o campo `refunded_at` existe: `SHOW COLUMNS FROM purchases`

### Webhook não está sendo chamado
- Verifique a URL no painel Hotmart
- Teste com curl manual (Passo 6.2)
- Veja logs: `supabase functions logs hotmart-webhook --tail`

### Thank You Page não encontra a compra
- Aguarde 10-30 segundos (Hotmart demora para enviar webhook)
- Verifique logs do webhook
- Confirme que o `transaction_id` está em `purchases`

### XP não aparece no app
- Faça logout e login novamente (force refresh)
- Verifique `profiles.xp` no Supabase Dashboard
- Confirme que `completed_steps` contém o step correto

---

## 📞 SUPORTE

Se algo der errado:
1. Copie os logs: `supabase functions logs hotmart-webhook`
2. Verifique as tabelas no Supabase Dashboard
3. Teste com curl manual
4. Verifique se as migrations SQL foram executadas

---

**Próximo passo:** Após validar, podemos criar a integração Google Sheets! 📊
