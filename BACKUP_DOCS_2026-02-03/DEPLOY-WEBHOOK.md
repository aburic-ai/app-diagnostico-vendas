# 🚀 Deploy do Webhook Hotmart - Guia Rápido

## ✅ O que foi modificado

**Data:** 2026-01-31

### Mudança Principal: Formatação de Nome

**Antes:**
- Salvava nome completo em maiúsculas: `"ANDRE AFFONSO BURIC"`

**Agora:**
- Salva apenas o **primeiro nome** em **Title Case**: `"Andre"`

### Código Modificado

**Arquivo:** `supabase/functions/hotmart-webhook/index.ts`

**Nova função adicionada:**
```typescript
function formatFirstName(fullName: string): string {
  if (!fullName) return ''

  // Pegar apenas o primeiro nome
  const firstName = fullName.trim().split(' ')[0]

  // Converter para Title Case (primeira letra maiúscula, resto minúsculo)
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
}
```

**Uso na linha 96:**
```typescript
const buyerNameRaw = buyer.name || `${buyer.first_name} ${buyer.last_name}`.trim()
const buyerName = formatFirstName(buyerNameRaw)  // "Andre" ao invés de "ANDRE AFFONSO BURIC"
```

---

## 🔧 Como Fazer o Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Fazer login (se ainda não fez)
~/.local/bin/supabase login

# 2. Deploy da função
cd "/Users/andre/Brainpower Dropbox/Brain Power/CLAUDE CODE/app-diagnostico-vendas"
~/.local/bin/supabase functions deploy hotmart-webhook

# 3. Verificar logs após deploy
~/.local/bin/supabase functions logs hotmart-webhook --tail
```

### Opção 2: Via Dashboard Supabase

1. **Acesse:** https://supabase.com/dashboard
2. **Vá em:** Edge Functions → hotmart-webhook
3. **Clique em:** "Edit" ou "Replace Function"
4. **Cole o conteúdo de:** `supabase/functions/hotmart-webhook/index.ts`
5. **Salve e Deploy**

---

## 🧪 Como Testar

### 1. Testar com Payload Mock

```bash
# Criar arquivo de teste
cat > /tmp/test-payload.json << 'EOF'
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "email": "teste@exemplo.com",
      "name": "JOAO DA SILVA SANTOS",
      "document": "12345678901",
      "checkout_phone_code": "55",
      "checkout_phone": "11987654321"
    },
    "product": {
      "id": 123456,
      "name": "Imersão Diagnóstico de Vendas"
    },
    "purchase": {
      "transaction": "HP999999TEST",
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
EOF

# Enviar teste
curl -X POST https://[SEU-PROJETO].supabase.co/functions/v1/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-secret" \
  -d @/tmp/test-payload.json
```

### 2. Verificar no Banco de Dados

**SQL para verificar:**
```sql
SELECT
  transaction_id,
  buyer_name,  -- Deve ser "Joao" (não "JOAO DA SILVA SANTOS")
  buyer_document,
  buyer_phone,
  status,
  created_at
FROM purchases
WHERE transaction_id = 'HP999999TEST';
```

**Resultado esperado:**
```
transaction_id  | buyer_name | buyer_document | buyer_phone      | status
----------------|------------|----------------|------------------|----------
HP999999TEST    | Joao       | 12345678901    | 55 11987654321   | approved
```

### 3. Testar Thank You Page

1. **Abra:** `https://app-diagnostico-vendas.vercel.app/obrigado?transaction=HP999999TEST`
2. **Deve mostrar:**
   - ✅ "Olá Joao!" (primeiro nome formatado)
   - ✅ "COMPRA IDENTIFICADA!"
   - ✅ Botão "INICIAR CALIBRAGEM"

---

## 🔄 Atualizar Compra Existente (HP0603054387)

**Problema:** Compra antiga tem `buyer_name = "ANDRE AFFONSO BURIC"`.

**Solução:** Atualizar manualmente no banco de dados.

### SQL para corrigir:

```sql
-- Atualizar buyer_name para apenas "Andre"
UPDATE purchases
SET buyer_name = 'Andre'
WHERE transaction_id = 'HP0603054387';

-- Verificar
SELECT transaction_id, buyer_name FROM purchases WHERE transaction_id = 'HP0603054387';
```

### Ou criar nova compra teste:

Faça uma nova compra de R$ 1 na Hotmart. O webhook processará automaticamente com a nova formatação.

---

## 📋 Checklist Pós-Deploy

- [ ] Edge Function deployada com sucesso
- [ ] Logs do webhook sem erros
- [ ] Teste com payload mock processado corretamente
- [ ] Banco de dados mostra `buyer_name` apenas com primeiro nome em Title Case
- [ ] Thank You Page exibe "Olá {PrimeiroNome}!" corretamente
- [ ] Compra HP0603054387 atualizada manualmente (se necessário)

---

## 🐛 Troubleshooting

### Erro: "Access token not provided"

**Causa:** Não está logado no Supabase CLI.

**Solução:**
```bash
~/.local/bin/supabase login
```

Ou configure o token:
```bash
export SUPABASE_ACCESS_TOKEN="seu-token-aqui"
~/.local/bin/supabase functions deploy hotmart-webhook
```

### Erro: "Function already exists"

**Causa:** Função já existe (normal).

**Solução:** O deploy vai sobrescrever automaticamente. Ignore o aviso.

### Webhook retorna erro 500

**Causa:** Verificar logs para ver o erro específico.

**Solução:**
```bash
~/.local/bin/supabase functions logs hotmart-webhook --tail
```

---

## 📚 Documentação Relacionada

- **Webhook completo:** [HOTMART-WEBHOOK-DOCS.md](./HOTMART-WEBHOOK-DOCS.md)
- **Migrations SQL:** [supabase-migrations-purchases-v2.sql](./supabase-migrations-purchases-v2.sql)
- **Plan completo:** `~/.claude/plans/serene-knitting-otter.md`

---

**Última atualização:** 2026-01-31
**Status:** ✅ Pronto para deploy
