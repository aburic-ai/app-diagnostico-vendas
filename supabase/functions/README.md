# Supabase Edge Functions - Diagnóstico de Vendas

Edge Functions para integração com Hotmart e Google Sheets.

## 📋 Funções Disponíveis

### 1. hotmart-webhook
Processa notificações de compra e reembolso da Hotmart.

**Eventos:**
- `PURCHASE_COMPLETE` → Registra compra + dá XP
- `PURCHASE_REFUNDED` → Reverte XP + marca como reembolsado
- `PURCHASE_CANCELED` → Mesmo comportamento que refunded

**Produtos mapeados:**
- Diagnóstico PDF → 40 XP
- Aulas Editadas → 40 XP
- Imersão IMPACT → 300 XP

### 2. sync-google-sheets (em desenvolvimento)
Sincroniza dados dos participantes com Google Sheets.

---

## 🚀 Setup & Deploy

### Pré-requisitos

1. **Supabase CLI instalado:**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase:**
   ```bash
   supabase login
   ```

3. **Link com o projeto:**
   ```bash
   supabase link --project-ref [seu-project-id]
   ```

### Variáveis de Ambiente

Configure as secrets no Supabase:

```bash
# Hotmart
supabase secrets set HOTMART_WEBHOOK_SECRET="seu-secret-hotmart"

# Google Sheets (para sync-google-sheets)
supabase secrets set GOOGLE_SHEET_ID="1ABC123XYZ..."
supabase secrets set GOOGLE_SERVICE_EMAIL="supabase@projeto.iam.gserviceaccount.com"
supabase secrets set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Para obter o `HOTMART_WEBHOOK_SECRET`:
1. Acesse o painel da Hotmart
2. Vá em Ferramentas → Webhooks
3. Copie o "Hottok" (token de autenticação)

### Deploy

**Deploy todas as funções:**
```bash
supabase functions deploy
```

**Deploy função específica:**
```bash
supabase functions deploy hotmart-webhook
```

**Ver logs:**
```bash
supabase functions logs hotmart-webhook
supabase functions logs hotmart-webhook --tail  # real-time
```

---

## 🔧 Configurar Webhook na Hotmart

1. Acesse: Hotmart → Ferramentas → Webhooks
2. URL do webhook:
   ```
   https://[seu-projeto].supabase.co/functions/v1/hotmart-webhook
   ```
3. Selecione os eventos:
   - ✅ Compra aprovada (PURCHASE_COMPLETE)
   - ✅ Reembolso (PURCHASE_REFUNDED)
   - ✅ Compra cancelada (PURCHASE_CANCELED)
4. Salvar

---

## 🧪 Testar Localmente

### 1. Executar função localmente:
```bash
supabase functions serve hotmart-webhook
```

### 2. Enviar payload de teste:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/hotmart-webhook' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --header 'X-Hotmart-Hottok: test-secret' \
  --data '{
    "event": "PURCHASE_COMPLETE",
    "data": {
      "transaction": "TEST-12345",
      "buyer": {
        "email": "teste@exemplo.com",
        "name": "João Teste"
      },
      "product": {
        "id": 123456,
        "name": "Diagnóstico de Vendas - PDF"
      },
      "purchase": {
        "price": {
          "value": 97.00,
          "currency_code": "BRL"
        },
        "approved_date": 1706745600000
      }
    }
  }'
```

### 3. Ver logs:
```bash
supabase functions logs hotmart-webhook --tail
```

---

## 📝 Payload Examples

### PURCHASE_COMPLETE
```json
{
  "event": "PURCHASE_COMPLETE",
  "data": {
    "transaction": "HP12345678",
    "product": {
      "id": 123456,
      "name": "Diagnóstico de Vendas - PDF"
    },
    "buyer": {
      "email": "usuario@email.com",
      "name": "Nome Completo"
    },
    "purchase": {
      "price": {
        "value": 97.00,
        "currency_code": "BRL"
      },
      "approved_date": 1706745600000
    }
  }
}
```

### PURCHASE_REFUNDED
```json
{
  "event": "PURCHASE_REFUNDED",
  "data": {
    "transaction": "HP12345678"
  }
}
```

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Certifique-se de configurar as secrets via `supabase secrets set`

### Erro: "Invalid signature"
- Verifique se o `HOTMART_WEBHOOK_SECRET` está correto
- Confira se o header `X-Hotmart-Hottok` está sendo enviado

### Compra não dá XP
- Verifique os logs: `supabase functions logs hotmart-webhook`
- Confirme que o produto foi mapeado corretamente (keywords no PRODUCT_MAP)
- Verifique se o transaction_id é único (constraint do banco)

### Usuário não criado automaticamente
- Confirme que o trigger `handle_new_user()` está ativo no Supabase
- Aguarde 1-2 segundos após criar auth user (delay no código)

---

## 📊 Monitoramento

### Ver status das funções:
```bash
supabase functions list
```

### Ver secrets configurados:
```bash
supabase secrets list
```

### Deletar função:
```bash
supabase functions delete hotmart-webhook
```

---

## 🔐 Segurança

- ✅ Webhook valida signature Hotmart (X-Hotmart-Hottok)
- ✅ Edge Function usa `service_role` key (bypass RLS)
- ✅ CORS configurado para aceitar apenas Hotmart
- ✅ Idempotência: verifica transaction_id antes de processar
- ✅ Rate limiting: Supabase tem limite de 500 req/s por função

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Hotmart Webhooks Documentation](https://developers.hotmart.com/docs/pt-BR/v1/webhooks/overview/)
- [Deno Deploy](https://deno.com/deploy/docs)
