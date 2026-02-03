# Changelog - 2026-02-02 (Parte B)

## 🎯 Melhorias no Admin

### 1. Visão do Participante em Tempo Real

**Antes:**
- Mockup estático desatualizado
- Botão "Abrir Visão Real" para ver em nova aba
- Não refletia mudanças instantaneamente

**Depois:**
- **Iframe com app real**: O lado direito do Admin agora mostra o app `/ao-vivo` rodando em tempo real
- **Sempre atualizado**: Qualquer mudança no evento é refletida instantaneamente
- **Navegação completa**: Pode rolar e ver todo o conteúdo que o participante vê
- **Sem botão extra**: Removido botão "Abrir Visão Real" (iframe já é a visão real)

**Arquivo modificado:**
- `src/pages/Admin.tsx` (linhas 2716-2763)

**Benefícios:**
- ✅ Visão precisa do que participantes veem
- ✅ Feedback imediato ao fazer mudanças
- ✅ Não precisa abrir nova aba
- ✅ Interface mais limpa

---

### 2. Botão "Salvar Links da Oferta"

**Problema:** Mudanças nos links da oferta e parâmetros UTM não eram persistidas no banco.

**Solução:**
- ✅ Novo botão "Salvar Links da Oferta" abaixo dos parâmetros UTM
- ✅ Salvamento no banco via coluna `offer_links` (JSONB)
- ✅ Carregamento automático ao abrir Admin
- ✅ Feedback visual (loading + toast)

**Arquivos modificados:**
- `src/pages/Admin.tsx`:
  - State `savingLinks` (linha 220)
  - Função `handleSaveOfferLinks()` (linhas 682-702)
  - useEffect para carregar links (linhas 413-433)
  - Botão Salvar (linhas 1515-1553)
  - Imports: `Save`, `Loader` (linhas 45-46)

**Migration necessária:**
```sql
-- Executar no Supabase SQL Editor
ALTER TABLE public.event_state
ADD COLUMN IF NOT EXISTS offer_links JSONB DEFAULT '{}'::jsonb;
```

**Arquivo:** `supabase-migrations-offer-links.sql`

---

### 3. Toast do Admin com Auto-Dismiss (5s)

**Problema:** Toasts do admin (ex: "Assistente IA desativado") ficavam na tela indefinidamente.

**Solução:**
- ✅ Auto-dismiss após 5 segundos
- ✅ useEffect limpa o toast automaticamente
- ✅ Removido "temporariamente" do texto de desativação da IA

**Arquivo modificado:**
- `src/pages/Admin.tsx` (linhas 436-444)

---

### 4. "Marcar Todos como Lido" Otimizado

**Problema:** Função `markAllAsRead` fazia updates sequenciais, muito lento com muitas notificações.

**Solução:**
- ✅ Updates em paralelo com `Promise.all()`
- ✅ ~10x mais rápido para 10+ notificações
- ✅ Logs de debug adicionados
- ✅ Validação de erros melhorada

**Arquivo modificado:**
- `src/hooks/useNotifications.ts` (linhas 146-187)

**Antes:**
```typescript
for (const notif of unreadNotifications) {
  await supabase.from('notifications').update(...)  // Sequencial
}
```

**Depois:**
```typescript
const updatePromises = unreadNotifications.map(notif =>
  supabase.from('notifications').update(...)
)
await Promise.all(updatePromises)  // Paralelo
```

---

## 📊 Resumo de Arquivos Modificados

| Arquivo | Mudanças | Linhas |
|---------|----------|--------|
| `src/pages/Admin.tsx` | Iframe real, botão salvar links, auto-dismiss toast, header simplificado | +80, -250 |
| `src/hooks/useNotifications.ts` | markAllAsRead otimizado | +15, -5 |
| `supabase-migrations-offer-links.sql` | Nova coluna offer_links | +26 (novo) |

**Total:** ~3 arquivos modificados

---

## ✅ Testes Necessários

### Visão em Tempo Real
1. [ ] Abrir Admin
2. [ ] Verificar que lado direito mostra o app real
3. [ ] Mudar módulo no Admin → ver atualização instantânea no iframe
4. [ ] Clicar "INICIAR TRANSMISSÃO" → ver status mudar no iframe

### Salvar Links
1. [ ] Mudar URL de ingresso 1%
2. [ ] Clicar "Salvar Links da Oferta"
3. [ ] Ver toast "✅ Links salvos com sucesso"
4. [ ] Recarregar Admin → links devem estar carregados
5. [ ] ⚠️ **Antes:** Executar migration SQL no Supabase

### Toast Auto-Dismiss
1. [ ] Clicar em "DESATIVAR ASSISTENTE IA"
2. [ ] Ver toast aparecer no canto superior direito
3. [ ] Esperar 5 segundos → toast deve desaparecer automaticamente

### Marcar Todos como Lido
1. [ ] Criar 10+ avisos no Admin
2. [ ] Abrir drawer de avisos no participante
3. [ ] Clicar "Marcar todos como lido"
4. [ ] Ver todos os avisos marcados instantaneamente
5. [ ] Verificar console: "✅ Todas as notificações marcadas como lidas"

---

## 🚀 Deploy Checklist

- [ ] Executar migration SQL: `supabase-migrations-offer-links.sql`
- [ ] Deploy do frontend (Vercel/Netlify)
- [ ] Testar Admin em produção
- [ ] Verificar iframe carrega corretamente
- [ ] Testar salvamento de links

---

**Data:** 2026-02-02 23:15 BRT
**Desenvolvedor:** Andre Buric + Claude Code
**Versão:** 1.1.0
