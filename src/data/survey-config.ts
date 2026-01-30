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
  orientation: string
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
}

export type SurveyQuestion = SurveyQuestionSelect | SurveyQuestionTextarea

// ============================================
// SURVEY INTRO
// ============================================

export const SURVEY_INTRO = {
  title: 'Suas respostas vao calibrar seu diagnostico',
  subtitle:
    'Preencha com atencao. Essas informacoes alimentam nosso sistema de diagnostico e permitem personalizar sua experiencia na imersao.',
}

// ============================================
// SURVEY QUESTIONS (SINGLE SOURCE OF TRUTH)
// ============================================

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'modeloNegocio',
    question: 'O que voce vende, fundamentalmente?',
    orientation:
      'Isso ajuda o sistema a trazer exemplos relevantes para o seu tipo de negocio.',
    promptLabel: 'Modelo de negocio',
    type: 'select',
    options: [
      'Servicos (consultoria, agencia, freelancer, terapia, etc.)',
      'Infoprodutos / Cursos / Mentoria',
      'Produtos fisicos / E-commerce',
      'Software / SaaS',
      'Negocio local (loja, clinica, restaurante, etc.)',
      'Outro',
    ],
    required: true,
  },
  {
    id: 'faturamento',
    question: 'Qual a faixa de faturamento mensal do seu negocio?',
    orientation:
      'Esse dado alimenta o simulador de impacto e ajuda a calcular o quanto uma melhoria na sua conversao representa em reais.',
    promptLabel: 'Faturamento mensal',
    type: 'select',
    options: [
      'Ainda nao faturo / Estou comecando',
      'Ate R$ 10.000/mes',
      'R$ 10.000 a R$ 50.000/mes',
      'R$ 50.000 a R$ 100.000/mes',
      'Acima de R$ 100.000/mes',
    ],
    required: true,
  },
  {
    id: 'ondeTrava',
    question: 'Onde voce sente que sua venda trava hoje?',
    orientation:
      'Isso direciona o diagnostico para a etapa certa do seu funil.',
    promptLabel: 'Onde a venda trava',
    type: 'select',
    options: [
      'Atracao — Poucas pessoas chegam, ou chega gente desqualificada',
      'Oferta — Pessoas chegam, gostam, mas acham caro ou dizem "vou pensar"',
      'Fechamento — Tenho leads, mas nao consigo converter na hora H',
      'Processo — Vendo, mas e baguncado e depende so de mim',
    ],
    required: true,
  },
  {
    id: 'tentativasAnteriores',
    question: 'O que voce ja tentou fazer para resolver isso?',
    orientation:
      'Liste o que ja testou (mudar preco, anuncios, scripts, contratar vendedor, etc.). Isso evita que o diagnostico sugira algo que voce ja tentou sem sucesso.',
    promptLabel: 'Tentativas anteriores para resolver',
    type: 'textarea',
    placeholder:
      'Ex: "Tentei baixar o preco, fiz anuncios no Instagram, comprei um curso de copywriting..."',
    required: true,
  },
  {
    id: 'investimentoAnterior',
    question: 'Quanto voce ja investiu em cursos ou mentorias de vendas?',
    orientation:
      'Ajuda o sistema a calibrar o nivel de profundidade do seu diagnostico.',
    promptLabel: 'Investimento em formacao de vendas',
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
    id: 'cursosAnteriores',
    question: 'Quais cursos ou mentorias de vendas voce ja fez?',
    orientation:
      'Se lembrar, liste os nomes. Isso ajuda a nao repetir conceitos que voce ja conhece.',
    promptLabel: 'Cursos e mentorias anteriores',
    type: 'textarea',
    placeholder:
      'Ex: "Fiz o curso X, mentoria do Y..." ou "Nenhum especifico de vendas"',
    required: false,
  },
  {
    id: 'problemaPrincipal',
    question:
      'Se voce pudesse sair dessa Imersao com UM problema resolvido, qual seria?',
    orientation:
      'Seja especifico. Essa resposta e usada para personalizar seu diagnostico e garantir que a imersao resolva o que mais importa pra voce.',
    promptLabel: 'Problema principal a resolver',
    type: 'textarea',
    placeholder:
      'Ex: "Parar de ouvir \'vou pensar\'" ou "Saber o que falar quando acham caro"',
    required: true,
  },
  {
    id: 'interessePos',
    question: 'Tem interesse em acompanhamento apos a Imersao?',
    orientation:
      'Isso nos ajuda a preparar opcoes relevantes para quem quiser continuar depois.',
    promptLabel: 'Interesse em acompanhamento pos-evento',
    type: 'select',
    options: [
      'Sim, quero saber mais sobre mentoria ou acompanhamento',
      'Talvez, depende dos resultados da imersao',
      'Nao no momento, so quero participar do evento',
    ],
    required: true,
  },
]

// ============================================
// DERIVED TYPES & HELPERS
// ============================================

export type SurveyFieldId = (typeof SURVEY_QUESTIONS)[number]['id']

export type SurveyData = Record<SurveyFieldId, string>

export function createEmptySurveyData(): SurveyData {
  const data: Record<string, string> = {}
  for (const q of SURVEY_QUESTIONS) {
    data[q.id] = ''
  }
  return data as SurveyData
}

export function getVisibleQuestions(_data: SurveyData): SurveyQuestion[] {
  return SURVEY_QUESTIONS
}
