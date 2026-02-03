# 10. DIAGNOSTIC - CÁLCULO DE SCORE E GARGALO

**Última Atualização:** 2026-02-03
**Arquivo de Implementação:** `src/pages/PosEvento.tsx` (linhas 194-280)

---

## 📋 ÍNDICE

1. [Origem dos Dados](#origem-dos-dados)
2. [Cálculo do Score](#calculo-do-score)
3. [Identificação do Gargalo](#identificacao-do-gargalo)
4. [Melhorias Implementadas](#melhorias-implementadas)
5. [Exemplos de Teste](#exemplos-de-teste)
6. [Verificação SQL](#verificacao-sql)

---

## 1. ORIGEM DOS DADOS

### Fonte: Tabela `diagnostic_entries`

Durante o evento, no `/ao-vivo`, o participante preenche 6 sliders IMPACT (valores de 0 a 10):

```typescript
{
  inspiracao: 7,      // I
  motivacao: 9,       // M
  preparacao: 8,      // P
  apresentacao: 9,    // A
  conversao: 10,      // C
  transformacao: 9    // T
}
```

**Campos na tabela:**
- `user_id`: ID do participante
- `event_day`: 1 ou 2 (Dia do evento)
- `block_number`: Número do bloco/módulo
- 6 campos numéricos (0-10): `inspiracao`, `motivacao`, `preparacao`, `apresentacao`, `conversao`, `transformacao`

---

## 2. CÁLCULO DO SCORE

### Fórmula Atual (Corrigida)

**Média dos 2 Dias × 10**

```typescript
// PASSO 1: Buscar dados
const diagnosticDay1 = getDiagnosticByDay(1)
const diagnosticDay2 = getDiagnosticByDay(2)

// PASSO 2: Calcular média de cada dimensão entre os 2 dias
if (diagnosticDataDay2 && diagnosticDay1) {
  const keys = ['inspiracao', 'motivacao', 'preparacao', 'apresentacao', 'conversao', 'transformacao']
  const avgData = {}

  keys.forEach(key => {
    avgData[key] = (diagnosticDataDay1[key] + diagnosticDataDay2[key]) / 2
  })

  // PASSO 3: Média das 6 dimensões
  const values = Object.values(avgData)
  const average = values.reduce((a, b) => a + b, 0) / values.length

  // PASSO 4: Score final
  const score = Math.round(average * 10)
}
```

### Exemplo Prático

```
Dia 1: I=6, M=7, P=8, A=9, C=10, T=9
Dia 2: I=8, M=9, P=9, A=10, C=10, T=9

Médias por dimensão:
I = (6+8)/2 = 7.0
M = (7+9)/2 = 8.0
P = (8+9)/2 = 8.5
A = (9+10)/2 = 9.5
C = (10+10)/2 = 10.0
T = (9+9)/2 = 9.0

Score = (7+8+8.5+9.5+10+9) / 6 × 10
      = 52 / 6 × 10
      = 8.67 × 10
      = 87/100 (arredondado)
```

### Caso Especial: Apenas 1 Dia

Se apenas Dia 1 OU Dia 2 foi preenchido:

```typescript
// Usa o dia disponível (sem média)
const diagnosticData = diagnosticDataDay2 || diagnosticDataDay1
const average = values.reduce((a, b) => a + b, 0) / values.length
const score = Math.round(average * 10)
```

**Exemplo:**
```
Apenas Dia 1: I=6, M=8, P=7, A=9, C=10, T=8

Score = (6+8+7+9+10+8) / 6 × 10
      = 48 / 6 × 10
      = 80/100
```

---

## 3. IDENTIFICAÇÃO DO GARGALO

### Fórmula: Menor Valor + Prioridade IMPACT

```typescript
// Mapa com prioridade IMPACT (ordem da sigla)
const gargaloMap = {
  inspiracao: { nome: 'Inspiração', peso: 1 },
  motivacao: { nome: 'Motivação', peso: 2 },
  preparacao: { nome: 'Preparação', peso: 3 },
  apresentacao: { nome: 'Apresentação', peso: 4 },
  conversao: { nome: 'Conversão', peso: 5 },
  transformacao: { nome: 'Transformação', peso: 6 },
}

// Ordenação com duplo critério
const sorted = entries.sort((a, b) => {
  // 1º critério: menor valor
  if (a[1] !== b[1]) return a[1] - b[1]

  // 2º critério (empate): prioridade IMPACT
  return gargaloMap[a[0]].peso - gargaloMap[b[0]].peso
})

const gargaloKey = sorted[0][0]      // Ex: 'inspiracao'
const gargaloValue = sorted[0][1]    // Ex: 7
```

### Exemplo com Empate

```
Médias: I=7, M=7, P=8, A=9, C=10, T=7

Menores valores: I=7, M=7, T=7 (empate triplo)

Prioridade IMPACT:
- I (peso 1) ✓ VENCE
- M (peso 2)
- T (peso 6)

Gargalo Final = I - Inspiração (7/10)
```

### Resultado Final

```typescript
gargalo = {
  etapa: 'Inspiração',  // Nome legível
  letra: 'I',           // Primeira letra
  valor: 7              // Valor numérico
}
```

---

## 4. MELHORIAS IMPLEMENTADAS

### ✅ Melhoria 1: Média dos 2 Dias

**ANTES (ERRADO):**
- Usava **SÓ Dia 2** (se existisse) OU **SÓ Dia 1**
- Desconsiderava dados de um dos dias

**DEPOIS (CORRETO):**
- Calcula **média de cada dimensão** entre os 2 dias
- Considera progressão do participante

**Impacto:**
```
Exemplo: Dia 1=[6,7,8,9,10,9], Dia 2=[8,9,9,10,10,9]

Score Antigo: 90/100 (só Dia 2)
Score Novo: 87/100 (média dos 2 dias) ✅
```

---

### ✅ Melhoria 2: Prioridade IMPACT em Empates

**ANTES (ERRADO):**
- Em empate, ordem era **alfabética**
- `conversao` vencia `inspiracao` em empate

**DEPOIS (CORRETO):**
- Prioriza ordem **IMPACT** (I > M > P > A > C > T)
- Segue metodologia do diagnóstico

**Impacto:**
```
Exemplo: I=7, T=7 (empate)

Gargalo Antigo: T - Transformação (alfabético)
Gargalo Novo: I - Inspiração (IMPACT) ✅
```

---

### ✅ Melhoria 3: Mensagem para Diagnóstico Pendente

**ANTES (ERRADO):**
- Mostrava 0/100 sempre, mesmo sem dados
- Confundia o participante

**DEPOIS (CORRETO):**
- Verifica se há dados: `hasDiagnostic = !!(diagnosticDay1 || diagnosticDay2)`
- Exibe mensagem especial se vazio

```typescript
{hasDiagnostic ? (
  <FinalReport score={score} gargalo={gargalo} />
) : (
  <div>
    <h3>DIAGNÓSTICO PENDENTE</h3>
    <p>Você não preencheu o diagnóstico IMPACT durante o evento ao vivo.</p>
  </div>
)}
```

---

## 5. EXEMPLOS DE TESTE

### Caso 1: Apenas Dia 1 Preenchido

```
Dia 1: I=6, M=8, P=7, A=9, C=10, T=8
Dia 2: (não preenchido)

Resultado:
Score = (6+8+7+9+10+8) / 6 × 10 = 80/100
Gargalo = I - Inspiração (6/10)
```

---

### Caso 2: Dia 1 e Dia 2 Preenchidos

```
Dia 1: I=6, M=7, P=8, A=9, C=10, T=9
Dia 2: I=8, M=9, P=9, A=10, C=10, T=9

Médias: I=7, M=8, P=8.5, A=9.5, C=10, T=9

Resultado:
Score = 87/100
Gargalo = I - Inspiração (7/10)
```

---

### Caso 3: Empate no Gargalo

```
Médias: I=7, M=7, P=8, A=9, C=10, T=7

Menores: I=7, M=7, T=7 (empate triplo)
Prioridade IMPACT: I (peso 1) vence

Resultado:
Gargalo = I - Inspiração (7/10) ✅
```

---

### Caso 4: Nenhum Dia Preenchido

```
Dia 1: (vazio)
Dia 2: (vazio)

Resultado:
hasDiagnostic = false
Renderiza: "DIAGNÓSTICO PENDENTE"
Score: (não exibido)
Gargalo: (não exibido)
```

---

## 6. VERIFICAÇÃO SQL

### Ver Diagnósticos do Usuário

```sql
SELECT
  user_id,
  event_day,
  inspiracao, motivacao, preparacao,
  apresentacao, conversao, transformacao,
  created_at
FROM diagnostic_entries
WHERE user_id = 'SEU_USER_ID'
ORDER BY event_day;
```

---

### Calcular Score Manualmente

```sql
-- Score por dia
SELECT
  user_id,
  event_day,
  (inspiracao + motivacao + preparacao + apresentacao + conversao + transformacao) / 6.0 as media,
  ROUND((inspiracao + motivacao + preparacao + apresentacao + conversao + transformacao) / 6.0 * 10) as score
FROM diagnostic_entries
WHERE user_id = 'SEU_USER_ID'
ORDER BY event_day;
```

---

### Calcular Média dos 2 Dias

```sql
WITH day_scores AS (
  SELECT
    user_id,
    event_day,
    inspiracao, motivacao, preparacao, apresentacao, conversao, transformacao
  FROM diagnostic_entries
  WHERE user_id = 'SEU_USER_ID'
)
SELECT
  user_id,
  ROUND(((d1.inspiracao + d2.inspiracao) / 2.0 +
         (d1.motivacao + d2.motivacao) / 2.0 +
         (d1.preparacao + d2.preparacao) / 2.0 +
         (d1.apresentacao + d2.apresentacao) / 2.0 +
         (d1.conversao + d2.conversao) / 2.0 +
         (d1.transformacao + d2.transformacao) / 2.0) / 6.0 * 10) as score_final
FROM day_scores d1
CROSS JOIN day_scores d2
WHERE d1.event_day = 1 AND d2.event_day = 2;
```

---

## 📊 RESUMO - DE ONDE VEM CADA NÚMERO

| Elemento | Origem | Cálculo |
|----------|--------|---------|
| **87/100** | Média dos 2 dias × 10 | `((Dia1+Dia2)/2 por dimensão) / 6 * 10` |
| **BOM** | Classificação por faixa | Score >= 80 = BOM |
| **I - Inspiração (7/10)** | Menor valor + prioridade IMPACT | `min(7, 8, 8.5, 9.5, 10, 9) = 7` |

---

## 🔍 LOGS DE DEBUG

No console do navegador em `/pos-evento`:

```javascript
📊 [PosEvento] Diagnóstico Dia 1: { inspiracao: 6, motivacao: 7, ... }
📊 [PosEvento] Diagnóstico Dia 2: { inspiracao: 8, motivacao: 9, ... }
📊 [PosEvento] Média dos 2 dias: { inspiracao: 7, motivacao: 8, ... }
📊 [PosEvento] Score calculado: 87
📊 [PosEvento] Gargalo identificado: I - Inspiração (7/10)
```

---

## 📚 ARQUIVOS RELACIONADOS

### Implementação
- `src/pages/PosEvento.tsx` (linhas 194-280) - Lógica de cálculo
- `src/components/ui/FinalReport.tsx` - Exibição do score
- `src/components/ui/ProfileCard.tsx` - Card com gargalo

### Database
- Tabela: `diagnostic_entries`
- Hook: `src/hooks/useDiagnostic.ts`

---

**Desenvolvido por:** Claude Code
**Data:** 2026-02-03
**Status:** ✅ Implementado e Testado
