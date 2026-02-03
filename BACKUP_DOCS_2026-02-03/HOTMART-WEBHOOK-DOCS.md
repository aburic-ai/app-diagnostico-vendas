# 📡 Webhook Hotmart - Documentação Completa

**Data de implementação:** 2026-01-31
**Status:** ✅ Em produção
**URL do Webhook:** `https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook`

---

## 🎯 Objetivo

Processar automaticamente compras da Hotmart, criar/atualizar usuários no Supabase e dar XP conforme o produto comprado.

---

## 🔧 Configuração

### 1. Variáveis de Ambiente (Supabase Dashboard)

```bash
HOTMART_WEBHOOK_SECRET="seu-secret-hotmart"  # Obter no painel Hotmart
SUPABASE_URL="https://[projeto].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Para bypass RLS
```

### 2. Configuração do Webhook (`supabase/config.toml`)

```toml
[functions.hotmart-webhook]
# Desabilitar validação JWT (Hotmart não envia Authorization header)
verify_jwt = false
```

### 3. Configurar URL na Hotmart

1. Acesse: **Hotmart → Ferramentas → Webhooks**
2. URL: `https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook`
3. Eventos:
   - `PURCHASE_APPROVED` ✅
   - `PURCHASE_PROTEST` ✅

---

## 📦 Produtos Mapeados

| Produto Hotmart | Slug | XP | Step ID | Keywords |
|-----------------|------|-----|---------|----------|
| **Imersão Diagnóstico de Vendas** | `imersao-diagnostico-vendas` | 0 | `event-access` | imersão, diagnóstico, vendas |
| **Imersão IMPACT** (presencial) | `impact-presencial` | 300 | `impact-enrollment` | impact, presencial |
| **Diagnóstico PDF** (order bump) | `diagnostico-pdf` | 40 | `purchase-pdf-diagnosis` | pdf, diagnóstico |
| **Aulas Editadas** (order bump) | `aulas-editadas` | 40 | `purchase-edited-lessons` | aulas, editadas |

**Detecção:** Via keywords no nome do produto (case-insensitive)

---

## 🗃️ Estrutura da Tabela `purchases`

```sql
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,  -- HP12345678
  price NUMERIC(10, 2),
  full_price NUMERIC(10, 2),  -- Preço cheio antes de desconto
  buyer_name TEXT,  -- ⚠️ Apenas PRIMEIRO NOME em Title Case (ex: "Andre")
  buyer_document TEXT,  -- CPF/CNPJ sem pontos (ex: "29365479894")
  buyer_phone TEXT,  -- DDI + telefone (ex: "55 11999999999")
  status TEXT CHECK (status IN ('approved', 'refunded', 'cancelled', 'pending')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX unique_transaction_id ON purchases(transaction_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_product ON purchases(product_slug);
CREATE INDEX idx_purchases_document ON purchases(buyer_document);
```

---

## 🔄 Fluxo de Processamento

### Evento: `PURCHASE_APPROVED`

1. **Validar signature** (Hotmart envia header `X-Hotmart-Hottok`)
2. **Extrair dados do payload:**
   ```typescript
   const { buyer, product, purchase } = data
   const email = buyer.email.toLowerCase().trim()
   const transactionId = purchase.transaction
   const buyerNameRaw = buyer.name || `${buyer.first_name} ${buyer.last_name}`.trim()
   const buyerName = formatFirstName(buyerNameRaw)  // "Andre" ✅
   const cpfCnpj = buyer.document
   ```

3. **Detectar produto via keywords:**
   ```typescript
   const productInfo = detectProduct(product.name)
   // Retorna: { slug, xp, stepId, keywords }
   ```

4. **Verificar idempotência:**
   ```typescript
   const { data: existingPurchase } = await supabase
     .from('purchases')
     .select('id')
     .eq('transaction_id', transactionId)
     .single()

   if (existingPurchase) return  // Já processado
   ```

5. **Encontrar ou criar usuário:**
   ```typescript
   let { data: profile } = await supabase
     .from('profiles')
     .select('*')
     .eq('email', email)
     .single()

   if (!profile) {
     // Criar novo usuário com senha padrão = CPF/CNPJ
     await supabase.auth.admin.createUser({
       email,
       password: cpfCnpj,  // Senha padrão (pode ser alterada pelo usuário)
       email_confirm: true
     })

     // Aguardar trigger criar profile
     await new Promise(resolve => setTimeout(resolve, 1500))

     // Buscar profile criado
     profile = await supabase.from('profiles').select('*').eq('email', email).single()
   }
   ```

6. **Atualizar nome no perfil:**
   ```typescript
   if (buyerName) {
     await supabase
       .from('profiles')
       .update({ name: buyerName })  // Salva "Andre" no profile
       .eq('id', profile.id)
   }
   ```

7. **Inserir registro de compra:**
   ```typescript
   const buyerPhone = buyer.checkout_phone
     ? `${buyer.checkout_phone_code || ''} ${buyer.checkout_phone}`.trim()
     : null

   await supabase.from('purchases').insert({
     user_id: profile.id,
     product_slug: productInfo.slug,
     transaction_id: transactionId,
     price: purchase.price?.value || null,
     full_price: purchase.full_price?.value || null,
     buyer_name: buyerName,  // "Andre" ✅
     buyer_document: cpfCnpj,
     buyer_phone: buyerPhone,
     status: 'approved',
     purchased_at: purchase.approved_date ? new Date(purchase.approved_date) : new Date()
   })
   ```

8. **Dar XP ao usuário:**
   ```typescript
   const currentSteps = profile.completed_steps || []

   // Evitar duplicação de XP
   if (!currentSteps.includes(productInfo.stepId)) {
     const newSteps = [...currentSteps, productInfo.stepId]
     const newXP = (profile.xp || 0) + productInfo.xp

     await supabase
       .from('profiles')
       .update({ completed_steps: newSteps, xp: newXP })
       .eq('id', profile.id)
   }
   ```

### Evento: `PURCHASE_PROTEST` (Reembolso)

1. **Buscar compra:**
   ```typescript
   const { data: purchase } = await supabase
     .from('purchases')
     .select('*, profiles!inner(*)')
     .eq('transaction_id', transaction)
     .single()
   ```

2. **Atualizar status:**
   ```typescript
   await supabase
     .from('purchases')
     .update({ status: 'refunded', refunded_at: new Date() })
     .eq('id', purchase.id)
   ```

3. **Reverter XP:**
   ```typescript
   const profile = purchase.profiles
   const newSteps = profile.completed_steps.filter(s => s !== productInfo.stepId)
   const newXP = Math.max(0, profile.xp - productInfo.xp)

   await supabase
     .from('profiles')
     .update({ completed_steps: newSteps, xp: newXP })
     .eq('id', profile.id)
   ```

---

## 🎨 Formatação de Nome

### Função `formatFirstName()`

**Objetivo:** Pegar apenas o primeiro nome e formatar em Title Case.

**Antes:**
```
"ANDRE AFFONSO BURIC"  ❌
```

**Depois:**
```
"Andre"  ✅
```

**Implementação:**
```typescript
function formatFirstName(fullName: string): string {
  if (!fullName) return ''

  // Pegar apenas o primeiro nome
  const firstName = fullName.trim().split(' ')[0]

  // Converter para Title Case (primeira letra maiúscula, resto minúsculo)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}
```

**Uso:**
```typescript
const buyerNameRaw = buyer.name || `${buyer.first_name} ${buyer.last_name}`.trim()
const buyerName = formatFirstName(buyerNameRaw)  // "Andre"
```

---

## 🧪 Testes

### Payload Mock (PURCHASE_APPROVED)

```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "teste@exemplo.com",
      "name": "ANDRE AFFONSO BURIC",
      "document": "29365479894",
      "checkout_phone_code": "55",
      "checkout_phone": "11999999999"
    },
    "product": {
      "id": 123456,
      "name": "Imersão Diagnóstico de Vendas"
    },
    "purchase": {
      "transaction": "HP0603054387",
      "price": {
        "value": 1.00,
        "currency_code": "BRL"
      },
      "full_price": {
        "value": 997.00
      },
      "approved_date": 1706745600000
    }
  }
}
```

### Comando de Teste (cURL)

```bash
curl -X POST https://[projeto].supabase.co/functions/v1/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-signature" \
  -d @payload.json
```

### Verificar Logs

```bash
~/.local/bin/supabase functions logs hotmart-webhook --tail
```

---

## 📊 Integração com Thank You Page

**URL:** `https://app-diagnostico-vendas.vercel.app/obrigado?transaction=HP0603054387`

**Fluxo:**
1. Hotmart redireciona para Thank You Page com `?transaction=HP...`
2. Page faz polling no Supabase a cada 2s (máximo 5 tentativas = 10s)
3. Query:
   ```typescript
   const { data: purchaseData } = await supabase
     .from('purchases')
     .select('user_id, buyer_name')
     .eq('transaction_id', searchIdentifier)
     .single()
   ```
4. Se encontrado:
   - Exibe: **"Olá {buyerName}!"** (ex: "Olá Andre!")
   - Status: **"COMPRA IDENTIFICADA!"**
   - Botão: **"INICIAR CALIBRAGEM"**

---

## 🚀 Deploy

### Deploy da Edge Function

```bash
# Login (se necessário)
~/.local/bin/supabase login

# Deploy
~/.local/bin/supabase functions deploy hotmart-webhook
```

### Configurar na Hotmart

1. **Hotmart Dashboard → Ferramentas → Webhooks**
2. **URL:** `https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook`
3. **Eventos:**
   - ✅ Compra Aprovada (`PURCHASE_APPROVED`)
   - ✅ Pedido de Reembolso (`PURCHASE_PROTEST`)
4. **Secret:** Copiar e adicionar em `HOTMART_WEBHOOK_SECRET` no Supabase

---

## ✅ Checklist de Validação

- [x] SQL migrations executadas
- [x] Edge Function deployada
- [x] Webhook configurado na Hotmart
- [x] Compra teste realizada (HP0603054387)
- [x] Registro salvo no banco com `buyer_name = "Andre"` ✅
- [ ] Thank You Page validando com nome correto
- [ ] Testar reembolso (reverter XP)

---

## 📝 Notas de Implementação

### Mudanças Recentes (2026-01-31)

1. **Formatação de nome:**
   - ❌ Antes: Salvava "ANDRE AFFONSO BURIC"
   - ✅ Agora: Salva apenas "Andre" (primeiro nome em Title Case)
   - Função: `formatFirstName()`

2. **Senha padrão:**
   - Usuários criados automaticamente com senha = CPF/CNPJ
   - Podem sobrescrever na Thank You Page

3. **Eventos Hotmart:**
   - `PURCHASE_APPROVED` → Dar acesso + XP
   - `PURCHASE_PROTEST` → Remover acesso + reverter XP

---

## 🐛 Troubleshooting

### Erro: "Product not mapped"

**Causa:** Nome do produto na Hotmart não contém as keywords esperadas.

**Solução:** Adicionar produto em `PRODUCT_MAP` no `index.ts`:
```typescript
novo_produto: {
  slug: 'produto-slug',
  xp: 50,
  stepId: 'purchase-novo-produto',
  keywords: ['keyword1', 'keyword2']
}
```

### Erro: "Purchase already processed"

**Causa:** Webhook sendo chamado múltiplas vezes com mesmo `transaction_id`.

**Solução:** Isso é esperado (idempotência). O sistema ignora duplicatas automaticamente.

### Erro: "Profile not created"

**Causa:** Trigger do Supabase não criou profile automaticamente.

**Solução:** Verificar se existe trigger para criar profile ao criar user em `auth.users`.

---

**Última atualização:** 2026-01-31
**Autor:** Claude Code
**Versão:** 2.0
