/**
 * Configuracao Centralizada da Pesquisa de Calibragem
 *
 * SINGLE SOURCE OF TRUTH
 * Este arquivo define todas as perguntas da pesquisa.
 * Alteracoes aqui se propagam automaticamente para:
 * - UI do ThankYou.tsx (renderizacao das perguntas)
 * - Prompt do WhatsApp (geracao de mensagem via IA)
 *
 * Para alterar perguntas:
 * 1. Modifique SURVEY_QUESTIONS abaixo
 * 2. O tipo SurveyData sera inferido automaticamente
 * 3. O prompt template em whatsapp-message.ts usa promptLabel
 */

// ============================================
// TYPES
// ============================================

export interface SurveyQuestionBase {
  id: string
  question: string
  promptLabel: string
  required: boolean
}

export interface SurveyQuestionSelect extends SurveyQuestionBase {
  type: 'select'
  options: string[]
}

export interface SurveyQuestionTextarea extends SurveyQuestionBase {
  type: 'textarea'
  placeholder: string
  maxLength?: number
  conditionalOn?: {
    field: string
    notValue: string
  }
}

export type SurveyQuestion = SurveyQuestionSelect | SurveyQuestionTextarea

// ============================================
// SURVEY QUESTIONS (SINGLE SOURCE OF TRUTH)
// ============================================

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'motivacao',
    question: 'O que te motivou a entrar na Imersao Diagnostico de Vendas?',
    promptLabel: 'Motivacao para participar',
    type: 'textarea',
    placeholder: 'Descreva o que te trouxe ate aqui...',
    required: true,
  },
  {
    id: 'tipoNegocio',
    question: 'Qual o tipo do seu negocio?',
    promptLabel: 'Tipo de negocio',
    type: 'select',
    options: [
      'Servicos (consultoria, agencia, etc.)',
      'Produtos fisicos',
      'Infoprodutos / Cursos',
      'SaaS / Software',
      'E-commerce',
      'Outro',
    ],
    required: true,
  },
  {
    id: 'faturamento',
    question: 'Qual o faturamento mensal atual?',
    promptLabel: 'Faturamento mensal',
    type: 'select',
    options: [
      'Ate R$ 10.000',
      'R$ 10.000 a R$ 50.000',
      'R$ 50.000 a R$ 100.000',
      'R$ 100.000 a R$ 500.000',
      'Acima de R$ 500.000',
    ],
    required: true,
  },
  {
    id: 'maiorGargalo',
    question: 'Qual o maior gargalo atual nas suas vendas?',
    promptLabel: 'Maior gargalo nas vendas',
    type: 'select',
    options: [
      'Atrair leads qualificados',
      'Converter leads em clientes',
      'Reter e fidelizar clientes',
      'Escalar sem perder qualidade',
    ],
    required: true,
  },
  {
    id: 'oQueJaTentou',
    question: 'O que voce ja tentou para resolver isso?',
    promptLabel: 'Tentativas anteriores para resolver',
    type: 'textarea',
    placeholder: 'Descreva brevemente...',
    required: true,
  },
  {
    id: 'quantoInvestiu',
    question: 'Quanto ja investiu em mentorias/cursos de vendas?',
    promptLabel: 'Investimento em formacao',
    type: 'select',
    options: [
      'Nunca investi',
      'Ate R$ 5.000',
      'R$ 5.000 a R$ 20.000',
      'Mais de R$ 20.000',
    ],
    required: true,
  },
  {
    id: 'quaisMentorias',
    question: 'Quais mentorias ou cursos ja fez?',
    promptLabel: 'Mentorias/cursos anteriores',
    type: 'textarea',
    placeholder: 'Liste os principais (ou "nenhum")...',
    conditionalOn: { field: 'quantoInvestiu', notValue: 'Nunca investi' },
    required: false,
  },
  {
    id: 'oQueQuerResolver',
    question: 'O que voce espera resolver com a Imersao?',
    promptLabel: 'Expectativa com a imersao',
    type: 'textarea',
    placeholder: 'Seja especifico sobre seu objetivo...',
    required: true,
  },
  {
    id: 'interesseAcompanhamento',
    question: 'Interesse em acompanhamento pos-evento?',
    promptLabel: 'Interesse em acompanhamento',
    type: 'select',
    options: [
      'Sim, quero saber mais sobre mentoria',
      'Talvez, depende dos resultados',
      'Nao, so quero participar do evento',
    ],
    required: true,
  },
]

// ============================================
// DERIVED TYPES & HELPERS
// ============================================

export type SurveyFieldId = typeof SURVEY_QUESTIONS[number]['id']

export type SurveyData = Record<SurveyFieldId, string>

export function createEmptySurveyData(): SurveyData {
  const data: Record<string, string> = {}
  for (const q of SURVEY_QUESTIONS) {
    data[q.id] = ''
  }
  return data as SurveyData
}

export function getVisibleQuestions(data: SurveyData): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter((q) => {
    if (q.type !== 'textarea' || !q.conditionalOn) return true
    const condValue = data[q.conditionalOn.field as keyof SurveyData]
    return condValue !== q.conditionalOn.notValue
  })
}
