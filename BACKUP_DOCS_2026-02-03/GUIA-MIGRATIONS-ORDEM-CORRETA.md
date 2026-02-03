# 🔧 GUIA DE EXECUÇÃO DAS MIGRATIONS - Ordem Correta

**Data:** 2026-02-02
**Status:** PRONTO PARA EXECUTAR

---

## 📋 O QUE ACONTECEU

### Erro Detectado:
```
ERROR: 42703: column "offer_unlocked" of relation "public.event_state" does not exist
```

### Causa:
A tabela `event_state` já existia no banco (criada por uma migration anterior), mas estava **incompleta** - faltavam as colunas:
- `offer_unlocked`
- `offer_visible`
- `ai_enabled`
- `lunch_active`
- `event_started_at`
- `event_finished_at`
- etc.

A migration v2 tentou criar a tabela completa, mas como ela já existia, o `CREATE TABLE IF NOT EXISTS` foi ignorado, e as colunas não foram adicionadas.

### Solução:
Criar uma **migration FIX** que adiciona apenas as colunas faltantes usando `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## ✅ MIGRATIONS JÁ EXECUTADAS (NÃO REPETIR)

1. ✅ `supabase-migrations-nps-responses-v2.sql` - OK
2. ✅ `supabase-migrations-event-state-v3-add-activity.sql` - OK (Status: offline)

---

## 🎯 ORDEM DE EXECUÇÃO - EXECUTAR AGORA

### 1️⃣ **FIX da Event State** (NOVO - Executar primeiro)

**Arquivo:** `supabase-migrations-event-state-v2-fix.sql`

**O que faz:**
- Adiciona colunas faltantes na tabela `event_state`
- Usa `ADD COLUMN IF NOT EXISTS` (idempotente)
- Define valores default para colunas vazias
- Atualiza constraint de status para incluir 'activity'

**Como executar:**
1. Abrir Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/yvjzkhxczbxidtdmkafx/sql/new
   ```

2. Copiar TODO o conteúdo de `supabase-migrations-event-state-v2-fix.sql`

3. Colar e executar

4. **Resultado esperado:**
   ```
   status: "Event State FIX completed!"
   details: "Colunas adicionadas: offer_unlocked, offer_visible, ai_enabled, lunch_active"

   SELECT * FROM event_state:
   - Deve mostrar todas as colunas
   - offer_unlocked: false
   - offer_visible: false
   - ai_enabled: true
   - status: offline
   ```

---

### 2️⃣ **Event State v4 - Add Start Time**

**Arquivo:** `supabase-migrations-event-state-v4-add-start-time.sql`

**O que faz:**
- Adiciona coluna `event_scheduled_start` (para countdown)
- Define data default: 28/02/2026 às 09:30 BRT

**Como executar:**
1. Mesma URL do Supabase SQL Editor

2. Copiar conteúdo de `supabase-migrations-event-state-v4-add-start-time.sql`

3. Executar

4. **Resultado esperado:**
   ```
   SELECT * FROM event_state:
   - event_scheduled_start: "2026-02-28 09:30:00-03"
   ```

---

## 🧪 VERIFICAÇÃO FINAL

Após executar as 2 migrations acima, executar este SQL para confirmar:

```sql
-- Verificar estrutura completa da tabela
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_state'
ORDER BY ordinal_position;

-- Verificar dados
SELECT * FROM event_state;
```

### ✅ Checklist de Colunas Esperadas:

- [ ] `id` (UUID)
- [ ] `status` (TEXT) - CHECK: 'offline', 'live', 'paused', 'finished', 'activity'
- [ ] `current_day` (INTEGER)
- [ ] `current_module` (INTEGER)
- [ ] `offer_unlocked` (BOOLEAN) ← **FIX adicionou**
- [ ] `offer_visible` (BOOLEAN) ← **FIX adicionou**
- [ ] `ai_enabled` (BOOLEAN) ← **FIX adicionou**
- [ ] `lunch_active` (BOOLEAN) ← **FIX adicionou**
- [ ] `lunch_started_at` (TIMESTAMPTZ) ← **FIX adicionou**
- [ ] `lunch_duration_minutes` (INTEGER) ← **FIX adicionou**
- [ ] `event_started_at` (TIMESTAMPTZ) ← **FIX adicionou**
- [ ] `event_finished_at` (TIMESTAMPTZ) ← **FIX adicionou**
- [ ] `event_scheduled_start` (TIMESTAMPTZ) ← **v4 adiciona**
- [ ] `updated_at` (TIMESTAMPTZ)
- [ ] `updated_by` (UUID)

---

## 📝 RESUMO DO FLUXO

```
┌─────────────────────────────────────┐
│ Tabela event_state já existia       │
│ (incompleta, faltavam colunas)      │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ Migration v2: tentou CREATE TABLE   │
│ ❌ IF NOT EXISTS ignorou colunas    │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ Migration v3: adicionou 'activity'  │
│ ✅ Funcionou (ALTER TABLE)          │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ Migration v2-fix: ADD COLUMN IF NOT │
│ ✅ Adiciona colunas faltantes       │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ Migration v4: event_scheduled_start │
│ ✅ Adiciona coluna de countdown     │
└──────────────┬──────────────────────┘
               │
               v
┌─────────────────────────────────────┐
│ Tabela event_state COMPLETA         │
│ ✅ Pronta para uso                  │
└─────────────────────────────────────┘
```

---

## 🚨 AVISOS IMPORTANTES

1. **NÃO executar novamente:**
   - `supabase-migrations-nps-responses-v2.sql` (já OK)
   - `supabase-migrations-event-state-v2.sql` (substituída pelo FIX)
   - `supabase-migrations-event-state-v3-add-activity.sql` (já OK)

2. **Ordem OBRIGATÓRIA:**
   - Primeiro: `v2-fix` (adiciona colunas base)
   - Depois: `v4` (adiciona event_scheduled_start)

3. **Idempotência:**
   - Todas as migrations usam `IF NOT EXISTS` ou `ADD COLUMN IF NOT EXISTS`
   - Seguro executar múltiplas vezes (não vai duplicar)

---

## 🎯 PRÓXIMOS PASSOS APÓS MIGRATIONS

1. **Testar Countdown:**
   ```sql
   -- Garantir evento offline
   UPDATE event_state SET status = 'offline';
   ```

2. **Abrir app:**
   - `http://localhost:5176/ao-vivo`
   - Verificar que countdown aparece

3. **Testar Admin:**
   - Abrir Admin
   - Clicar "INICIAR TRANSMISSÃO"
   - Verificar que countdown desaparece no AoVivo

4. **Testar Perfil:**
   - Clicar no avatar (canto superior direito)
   - Verificar que ProfileModal abre
   - Editar nome/foto
   - Salvar e confirmar que atualiza

---

## 📁 ARQUIVOS DE REFERÊNCIA

- ✅ [supabase-migrations-event-state-v2-fix.sql](supabase-migrations-event-state-v2-fix.sql) - **Executar primeiro**
- ✅ [supabase-migrations-event-state-v4-add-start-time.sql](supabase-migrations-event-state-v4-add-start-time.sql) - **Executar depois**
- 📖 [MELHORIAS-COMPLETAS.md](MELHORIAS-COMPLETAS.md) - Documentação completa
- 📖 [TASK-4-VERIFICACAO-PERSISTENCIA.md](TASK-4-VERIFICACAO-PERSISTENCIA.md) - Guia de verificação

---

**Última atualização:** 2026-02-02 04:00 BRT

**Próximo passo:** Execute as 2 migrations na ordem indicada e teste o countdown + perfil!
