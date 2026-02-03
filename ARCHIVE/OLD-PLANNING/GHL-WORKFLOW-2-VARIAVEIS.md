# 📋 GHL WORKFLOW 2 - VARIÁVEIS DE CONFIGURAÇÃO

**Referência rápida para copiar/colar no Go High Level**

---

## 🔗 WEBHOOK ACTION (HTTP Request)

### URL
```
https://yvjzkhxczbxidtdmkafx.supabase.co/functions/v1/generate-audio
```

### Method
```
POST
```

### Timeout
```
60000
```
(60 segundos em milissegundos)

---

## 📦 CUSTOM DATA (3 items)

Adicione estes 3 campos no "Custom Data":

### Item 1
- **Key:** `email`
- **Value:** `{{body.buyer.email}}`

### Item 2
- **Key:** `transaction_id`
- **Value:** `{{body.transaction_id}}`

### Item 3
- **Key:** `ghl_contact_id`
- **Value:** `{{contact.id}}`

---

## 🔐 HEADERS (2 items)

Adicione estes 2 campos no "Headers":

### Header 1
- **Key:** `Content-Type`
- **Value:** `application/json`

### Header 2
- **Key:** `Authorization`
- **Value:**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2anpraHhjemJ4aWR0ZG1rYWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjY5NzEsImV4cCI6MjA4NTQ0Mjk3MX0.ZvPpEsvEzP9Msu9ll1HSnQPwAMwOPe7a9rdieaKLAR4
```

⚠️ **COPIE O TOKEN COMPLETO** (incluindo "Bearer ")

---

## 📝 UPDATE CONTACT FIELD

### Como descobrir a variável correta

1. No GHL, na action "Update Contact Field"
2. Clique no ícone `{x}` ("Insert Variable")
3. Procure pela resposta do webhook anterior
4. Pode aparecer como:
   - `webhook_response`
   - `Webhook` (nome da ação)
   - `response`

### Configuração dos campos

Adicione 2 fields:

#### Field 1
- **Field Name:** `audio_diagnosticovendas_url`
- **Value:** `{{webhook_response.audio_url}}`

  **(ou `{{Webhook.audio_url}}` se o GHL usar nome da ação)**

#### Field 2
- **Field Name:** `imdiagnosticovendas_audio_script`
- **Value:** `{{webhook_response.script}}`

  **(ou `{{Webhook.script}}` se o GHL usar nome da ação)**

---

## ⚠️ CHECKLIST PRÉ-TESTE

Antes de testar o workflow, confirme:

- [ ] URL do webhook está correta (sem espaços extras)
- [ ] Timeout configurado para 60000 ou mais
- [ ] Custom Data usa `{{body.buyer.email}}` (NÃO `{{contact.email}}`)
- [ ] Authorization header está COMPLETO (500+ caracteres)
- [ ] Update Contact Field usa variável correta (verificar com Insert Variable)
- [ ] Custom fields existem no GHL com nomes EXATOS:
  - `audio_diagnosticovendas_url`
  - `imdiagnosticovendas_audio_script`

---

## 🧪 COMO TESTAR

### Teste Manual via GHL

1. Abra o Workflow 2 no GHL
2. Clique em "Test" ou "Run Manually"
3. Insira este payload de teste:

```json
{
  "buyer": {
    "name": "Teste GHL",
    "email": "SEU-EMAIL-REAL@GMAIL.COM",
    "checkout_phone": "+5511999999999"
  },
  "transaction_id": "HP_TESTE_123",
  "event": "survey_completed"
}
```

⚠️ **IMPORTANTE:** Substitua `SEU-EMAIL-REAL@GMAIL.COM` por um email que **realmente tenha um survey preenchido** no banco de dados.

### Verificar Resultado

1. Aguarde ~60 segundos
2. Veja os logs do workflow
3. Procure pela resposta do webhook:

**Resposta de sucesso:**
```json
{
  "success": true,
  "audio_url": "https://yvjzkhxczbxidtdmkafx.supabase.co/storage/v1/object/public/survey-audios/...",
  "script": "Fala, Teste GHL! Aqui é o André...",
  "duration_seconds": 85
}
```

4. Verifique se os custom fields foram atualizados no contato

---

## ❌ ERROS COMUNS

### "Survey não encontrado"
- Email usado não tem survey no banco
- Verifique: `SELECT * FROM survey_responses WHERE email = 'email@teste.com';`

### "401 Unauthorized"
- Token truncado ou errado
- Copie novamente o token completo acima

### Custom fields vazios
- Variável errada (`{{webhook.audio_url}}` ao invés de `{{webhook_response.audio_url}}`)
- Use "Insert Variable" para descobrir nome correto

### Timeout após 30s
- Timeout não configurado ou muito baixo
- Configure para 60000ms ou mais

---

**Última atualização:** 2026-02-02 00:15 BRT
**Documentação completa:** [FLUXO_AUDIO_BOASVINDAS.md](./FLUXO_AUDIO_BOASVINDAS.md)
