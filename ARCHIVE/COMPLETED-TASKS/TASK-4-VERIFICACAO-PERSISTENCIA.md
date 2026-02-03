# ✅ TASK 4 - VERIFICAÇÃO DE PERSISTÊNCIA DE DADOS

**Data:** 2026-02-02
**Objetivo:** Verificar que TODOS os dados do usuário persistem corretamente no banco
**Status:** GUIA DE TESTES

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### ✅ 1. DIAGNOSTIC SLIDERS (Diagnóstico IMPACT)

**Arquivo:** `src/hooks/useDiagnostic.ts`
**Tabela:** `diagnostic_entries`

#### Teste:

1. **Abrir AoVivo:** `http://localhost:5176/ao-vivo`

2. **Mover os sliders:**
   - Inspiração: 7
   - Motivação: 8
   - Preparação: 5
   - Apresentação: 6
   - Conversão: 4
   - Transformação: 9

3. **Recarregar a página (F5)**

4. **Verificar:**
   - ✅ Sliders mantêm as posições
   - ✅ Gráfico radar mantém os valores
   - ✅ Gargalo identificado está correto

#### SQL Verification:

```sql
-- Ver entradas do diagnóstico
SELECT
  user_id,
  day,
  dimension,
  score,
  created_at,
  updated_at
FROM diagnostic_entries
WHERE user_id = 'SEU_USER_ID'  -- Substituir pelo ID real
ORDER BY day, dimension;

-- Ver todas as dimensões do Dia 1
SELECT dimension, score
FROM diagnostic_entries
WHERE user_id = 'SEU_USER_ID' AND day = 1;

-- Verificar se há duplicatas (não deveria ter)
SELECT user_id, day, dimension, COUNT(*)
FROM diagnostic_entries
GROUP BY user_id, day, dimension
HAVING COUNT(*) > 1;
```

#### Esperado:
- ✅ 6 registros por dia (1 por dimensão IMPACT)
- ✅ `updated_at` atualiza quando slider move
- ✅ Scores corretos (0-10)
- ✅ Não há duplicatas

---

### ✅ 2. USER PROGRESS (XP e Steps Completados)

**Arquivo:** `src/hooks/useUserProgress.ts`
**Tabela:** `profiles` (campos: `xp`, `completed_steps`)

#### Teste A: Ganhar XP

1. **Ver XP atual:** Canto superior (ex: "20 XP")

2. **Completar uma ação que dá XP:**
   - Preencher survey (+50 XP)
   - Responder NPS (+30 XP)
   - Confirmar presença em módulo (+10 XP)

3. **Verificar:**
   - ✅ XP incrementa visualmente
   - ✅ Animação de "+XX XP" aparece

4. **Recarregar página**

5. **Verificar:**
   - ✅ XP mantém o valor atualizado

#### SQL Verification:

```sql
-- Ver XP e steps do usuário
SELECT
  id,
  name,
  email,
  xp,
  completed_steps,
  updated_at
FROM profiles
WHERE id = 'SEU_USER_ID';

-- Ver histórico de XP (se tiver tabela de log)
SELECT * FROM xp_history WHERE user_id = 'SEU_USER_ID' ORDER BY created_at DESC;
```

#### Teste B: Steps Completados

1. **Completar um step:**
   - Confirmar presença em módulo
   - Responder NPS
   - Completar perfil

2. **Verificar que o step não pode ser completado novamente**

3. **Recarregar página**

4. **Verificar:**
   - ✅ Step continua marcado como completo
   - ✅ Não ganhou XP duplicado

#### SQL Verification:

```sql
-- Ver steps completados
SELECT
  unnest(completed_steps) as step_id
FROM profiles
WHERE id = 'SEU_USER_ID';

-- Verificar steps específicos
SELECT
  id,
  'nps-day1' = ANY(completed_steps) as nps_day1_completed,
  'module-5-checkin' = ANY(completed_steps) as module_5_completed,
  'profile-complete' = ANY(completed_steps) as profile_completed
FROM profiles
WHERE id = 'SEU_USER_ID';
```

#### Esperado:
- ✅ XP incrementa e persiste
- ✅ `completed_steps` é um array de strings
- ✅ Steps não duplicam
- ✅ XP não duplica ao recarregar

---

### ✅ 3. SURVEY RESPONSES (Pesquisa de Calibragem)

**Arquivo:** `src/data/survey.ts` + componente SurveyForm
**Tabela:** `survey_responses`

#### Teste:

1. **Preencher Survey (PreEvento):**
   - 8 perguntas de calibragem
   - Incluindo: faturamento, onde trava, modelo de negócio, etc.

2. **Enviar o survey**

3. **Verificar:**
   - ✅ Mensagem de sucesso
   - ✅ XP ganho (+50 XP)

4. **Recarregar página**

5. **Verificar:**
   - ✅ Survey não pode ser preenchido novamente
   - ✅ Dados estão salvos

6. **Ir para PosEvento**

7. **Verificar:**
   - ✅ Projeção 30-60-90 usa dados do survey
   - ✅ Personalização baseada em faturamento/gargalo

#### SQL Verification:

```sql
-- Ver respostas do survey
SELECT
  user_id,
  survey_data,
  created_at
FROM survey_responses
WHERE user_id = 'SEU_USER_ID';

-- Ver campos específicos do survey_data (JSON)
SELECT
  user_id,
  survey_data->>'faturamento' as faturamento,
  survey_data->>'ondeTrava' as onde_trava,
  survey_data->>'modeloNegocio' as modelo_negocio,
  survey_data->>'tempoMercado' as tempo_mercado
FROM survey_responses
WHERE user_id = 'SEU_USER_ID';

-- Verificar que só tem 1 survey por usuário
SELECT user_id, COUNT(*)
FROM survey_responses
GROUP BY user_id
HAVING COUNT(*) > 1;
```

#### Esperado:
- ✅ 1 registro por usuário
- ✅ `survey_data` é JSON com todas as respostas
- ✅ Constraint UNIQUE impede duplicatas
- ✅ Dados carregam corretamente no PosEvento

---

### ✅ 4. NPS RESPONSES (Avaliação NPS)

**Arquivo:** `src/components/ui/NPSModal.tsx`
**Tabela:** `nps_responses`

#### Teste:

1. **Admin:** Enviar NPS Dia 1

2. **AoVivo:** Modal trava a tela

3. **Escolher score:** 9 (Promotor)

4. **Preencher feedback opcional**

5. **Enviar**

6. **Verificar:**
   - ✅ Modal fecha
   - ✅ XP ganho (+30 XP)

7. **Recarregar página**

8. **Verificar:**
   - ✅ Modal NPS não aparece novamente

9. **Admin:** Enviar NPS Final

10. **Verificar:**
    - ✅ Novo modal aparece (NPS Final é diferente de Dia 1)

#### SQL Verification:

```sql
-- Ver respostas NPS
SELECT
  user_id,
  type,
  score,
  feedback,
  created_at
FROM nps_responses
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at;

-- Ver análise agregada
SELECT * FROM nps_analysis;

-- Ver categorização
SELECT
  type,
  score,
  CASE
    WHEN score >= 9 THEN 'Promotor'
    WHEN score >= 7 THEN 'Passivo'
    ELSE 'Detrator'
  END as categoria
FROM nps_responses
WHERE user_id = 'SEU_USER_ID';
```

#### Esperado:
- ✅ Máximo 2 registros por usuário (day1 + final)
- ✅ Constraint UNIQUE (user_id, type) impede duplicatas
- ✅ Score entre 0-10
- ✅ Feedback pode ser NULL

---

### ✅ 5. PROFILE DATA (Dados do Perfil)

**Arquivo:** `src/components/ui/ProfileModal.tsx`
**Tabela:** `profiles`

#### Teste A: Atualizar Nome

1. **Abrir ProfileModal** (qualquer página)

2. **Mudar nome:** "João Silva" → "João Silva Santos"

3. **Salvar**

4. **Verificar:**
   - ✅ Modal fecha
   - ✅ Avatar atualiza com novo nome

5. **Recarregar página**

6. **Verificar:**
   - ✅ Nome mantém atualizado

#### Teste B: Upload de Foto

1. **Abrir ProfileModal**

2. **Fazer upload de foto** (max 2MB, JPG/PNG)

3. **Verificar:**
   - ✅ Upload progride
   - ✅ Foto aparece no modal

4. **Salvar**

5. **Recarregar página**

6. **Verificar:**
   - ✅ Avatar mostra foto
   - ✅ Todas as páginas mostram a foto

#### SQL Verification:

```sql
-- Ver dados do perfil
SELECT
  id,
  name,
  email,
  phone,
  "photoUrl" as photo_url,
  is_admin,
  xp,
  created_at,
  updated_at
FROM profiles
WHERE id = 'SEU_USER_ID';

-- Ver foto no Storage
-- Supabase Dashboard → Storage → avatars bucket
```

#### Esperado:
- ✅ `name` atualiza imediatamente
- ✅ `photoUrl` aponta para URL pública do Storage
- ✅ `updated_at` atualiza
- ✅ Foto acessível via URL

---

### ✅ 6. EVENT STATE (Estado do Evento)

**Arquivo:** `src/hooks/useEventState.ts`
**Tabela:** `event_state`

#### Teste:

1. **Admin:** Iniciar transmissão

2. **Verificar:** AoVivo mostra "AO VIVO"

3. **Admin:** Fechar aba completamente

4. **Reabrir Admin**

5. **Verificar:**
   - ✅ Status continua "live"
   - ✅ Módulo mantém a posição
   - ✅ Dia mantém selecionado

6. **Admin:** Trocar para Módulo 10

7. **Fechar navegador completamente**

8. **Reabrir navegador → Admin**

9. **Verificar:**
   - ✅ Módulo 10 continua selecionado

#### SQL Verification:

```sql
-- Ver estado do evento
SELECT
  status,
  current_day,
  current_module,
  offer_unlocked,
  offer_visible,
  lunch_active,
  ai_enabled,
  event_started_at,
  event_scheduled_start,
  updated_at,
  updated_by
FROM event_state;

-- Ver quem fez a última mudança
SELECT
  es.status,
  es.updated_at,
  p.name as updated_by_name,
  p.email as updated_by_email
FROM event_state es
LEFT JOIN profiles p ON es.updated_by = p.id;
```

#### Esperado:
- ✅ 1 único registro (singleton)
- ✅ Mudanças persistem
- ✅ `updated_by` registra admin que fez mudança
- ✅ Realtime sincroniza entre tabs

---

### ✅ 7. NOTIFICATIONS (Avisos)

**Arquivo:** `src/hooks/useNotifications.ts`
**Tabela:** `notifications`

#### Teste:

1. **Admin:** Criar um aviso

2. **AoVivo:** Verificar que aviso aparece

3. **Marcar como lido**

4. **Recarregar página**

5. **Verificar:**
   - ✅ Aviso continua marcado como lido
   - ✅ Badge não mostra "não lido"

6. **Admin:** Criar aviso clickable (link interno)

7. **Clicar no aviso**

8. **Verificar:**
   - ✅ Navega para página correta
   - ✅ Scroll para seção correta

#### SQL Verification:

```sql
-- Ver avisos
SELECT
  id,
  type,
  title,
  message,
  read_by,
  action_type,
  target_page,
  target_section,
  created_at
FROM notifications
ORDER BY created_at DESC;

-- Ver avisos não lidos para usuário
SELECT *
FROM notifications
WHERE NOT ('SEU_USER_ID' = ANY(read_by));

-- Ver avisos lidos para usuário
SELECT *
FROM notifications
WHERE 'SEU_USER_ID' = ANY(read_by);
```

#### Esperado:
- ✅ `read_by` é array de UUIDs
- ✅ Realtime atualiza quando novo aviso criado
- ✅ `action_type`, `target_page`, `target_section` corretos

---

## 🐛 PROBLEMAS CONHECIDOS A VERIFICAR

### Issue 1: Diagnostic Sliders podem não salvar

**Sintoma:** Slider move mas ao recarregar volta para 0

**Causa possível:**
- `saveDiagnostic()` não está sendo chamado
- RLS policy bloqueando write
- Constraint violation

**Verificar:**
```sql
-- Ver se há registros sendo criados
SELECT COUNT(*) FROM diagnostic_entries;

-- Ver RLS policies
SELECT * FROM pg_policies WHERE tablename = 'diagnostic_entries';
```

**Solução:**
- Verificar logs do console (F12)
- Verificar que user_id está correto
- Testar com `await saveDiagnostic()` explícito

---

### Issue 2: XP duplicando

**Sintoma:** Ganhar +30 XP duas vezes pela mesma ação

**Causa possível:**
- `completeStep()` sendo chamado múltiplas vezes
- Step não sendo adicionado a `completed_steps`

**Verificar:**
```sql
-- Ver se step está em completed_steps
SELECT completed_steps FROM profiles WHERE id = 'USER_ID';

-- Ver se XP é consistente
SELECT xp FROM profiles WHERE id = 'USER_ID';
```

**Solução:**
- Adicionar check: `if (completed_steps.includes(stepId)) return`
- Usar transaction para atomicidade

---

### Issue 3: Survey permitindo responder múltiplas vezes

**Sintoma:** Consegue enviar survey mais de uma vez

**Causa possível:**
- Constraint UNIQUE não está aplicado
- Frontend não verifica se já existe survey

**Verificar:**
```sql
-- Ver constraint
SELECT * FROM pg_constraint
WHERE conname LIKE '%survey%' AND conrelid = 'survey_responses'::regclass;

-- Ver duplicatas
SELECT user_id, COUNT(*)
FROM survey_responses
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Solução:**
- Aplicar constraint: `UNIQUE(user_id)`
- Frontend: verificar antes de mostrar form

---

## ✅ CHECKLIST FINAL

Marque cada item após testar:

### Dados Persistem:
- [ ] Diagnostic sliders salvam e carregam
- [ ] XP incrementa e não duplica
- [ ] Steps completados não resetam
- [ ] Survey salva e não permite duplicata
- [ ] NPS salva com constraint UNIQUE
- [ ] Profile (nome, foto, telefone) atualiza
- [ ] Event state persiste entre sessões
- [ ] Notificações salvam read_by corretamente

### Realtime Funciona:
- [ ] Admin muda status → AoVivo atualiza
- [ ] Admin cria aviso → Usuários veem
- [ ] Admin libera oferta → PosEvento atualiza

### Constraints Funcionam:
- [ ] Não consegue criar NPS duplicado (user_id, type)
- [ ] Não consegue criar survey duplicado (user_id)
- [ ] Event state é singleton (apenas 1 registro)

### Performance:
- [ ] Queries são rápidas (<500ms)
- [ ] Realtime não causa lag
- [ ] Upload de foto funciona (<5s para 2MB)

---

## 📊 QUERY DE AUDITORIA COMPLETA

Execute esta query para ver um resumo de todos os dados do usuário:

```sql
WITH user_data AS (
  SELECT
    p.id,
    p.name,
    p.email,
    p.xp,
    array_length(p.completed_steps, 1) as num_steps_completed,
    p.created_at as user_since,

    -- Survey
    (SELECT COUNT(*) FROM survey_responses WHERE user_id = p.id) as has_survey,

    -- NPS
    (SELECT COUNT(*) FROM nps_responses WHERE user_id = p.id) as num_nps_responses,

    -- Diagnostic
    (SELECT COUNT(DISTINCT day) FROM diagnostic_entries WHERE user_id = p.id) as diagnostic_days_filled,
    (SELECT COUNT(*) FROM diagnostic_entries WHERE user_id = p.id) as total_diagnostic_entries,

    -- Notifications read
    (SELECT COUNT(*) FROM notifications WHERE p.id = ANY(read_by)) as notifications_read

  FROM profiles p
  WHERE p.id = 'SEU_USER_ID'
)
SELECT * FROM user_data;
```

**Resultado esperado:**
```
id                | uuid
name              | string
email             | string
xp                | integer >= 0
num_steps         | integer >= 0
user_since        | timestamp
has_survey        | 0 ou 1
num_nps          | 0, 1 ou 2
diagnostic_days   | 0, 1 ou 2
total_entries     | 0 a 12 (6 por dia)
notifications_read| integer >= 0
```

---

## 🎯 RESULTADO ESPERADO

Após completar todos os testes:

✅ **TODOS** os dados persistem corretamente
✅ **NENHUMA** duplicata é criada
✅ **REALTIME** funciona sem lag
✅ **CONSTRAINTS** impedem dados inválidos
✅ **RLS POLICIES** permitem read/write correto

**Se algum item falhar:**
1. Anotar o erro exato
2. Verificar SQL query correspondente
3. Verificar logs do console (F12)
4. Verificar RLS policies
5. Reportar issue com detalhes

---

**Última atualização:** 2026-02-02 03:45 BRT
**Próximo passo:** Executar testes e marcar checklist
