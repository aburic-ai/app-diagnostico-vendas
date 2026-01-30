/**
 * Gerador de Mensagem WhatsApp Personalizada
 *
 * Usa o survey-config.ts como fonte de verdade.
 * Quando as perguntas mudam, o prompt se adapta automaticamente
 * via os promptLabels definidos no config.
 *
 * Fluxo:
 * 1. buildWhatsAppPrompt() - Monta o prompt completo para Claude API
 * 2. generateWhatsAppMessage() - Chama API e retorna texto (TODO: backend)
 * 3. getFallbackMessage() - Mensagem generica caso API falhe
 */

import { SURVEY_QUESTIONS, type SurveyData } from '../data/survey-config'

// ============================================
// PROMPT BUILDER
// ============================================

function buildSurveyContext(data: SurveyData): string {
  const lines: string[] = []
  for (const question of SURVEY_QUESTIONS) {
    const value = data[question.id as keyof SurveyData]
    if (value && value.trim()) {
      lines.push(`- ${question.promptLabel}: ${value}`)
    }
  }
  return lines.join('\n')
}

export function buildWhatsAppPrompt(surveyData: SurveyData, nome?: string): string {
  const surveyContext = buildSurveyContext(surveyData)
  const nomeDisplay = nome || 'participante'

  return `Voce e o Andre Buric, estrategista de vendas. Gere uma mensagem de WhatsApp personalizada para um novo aluno da Imersao Diagnostico de Vendas.

DADOS DO ALUNO:
Nome: ${nomeDisplay}
${surveyContext}

ESTRUTURA DA MENSAGEM (5 blocos obrigatorios):

1. SAUDACAO
- Use o nome do aluno
- Tom acolhedor mas direto
- Reconheca a decisao de participar

2. VALIDACAO + DIAGNOSTICO INICIAL
- Reflita o que o aluno respondeu na pesquisa
- Mostre que voce entendeu o cenario dele
- Aponte o gargalo principal baseado nas respostas
- Use dados especificos que ele forneceu

3. DIRECIONAMENTO PARA O DOSSIE
- Direcione para o video "Dossie de Inteligencia"
- Mencione os 7 Ruidos Neurais que serao abordados:
  1. Identidade (00:00 - como o cliente se enxerga)
  2. Sequencia (05:30 - a ordem que muda a percepcao)
  3. Prova (11:00 - o tipo certo de evidencia)
  4. Complexidade (16:30 - quando simplificar destroi)
  5. Urgencia (22:00 - o gatilho que nao e pressao)
  6. Comando (27:30 - a frase que fecha sem forcar)
  7. Dissonancia (33:00 - por que o cliente trava)
- Conecte um dos ruidos ao gargalo especifico do aluno

4. ELEVACAO DA IMERSAO
- Reforce a importancia de estar presente nos 2 dias
- Mencione que o app (cockpit) sera a ferramenta principal
- Crie antecipacao sem entregar conteudo

5. FECHAMENTO
- Tom de parceria, nao de professor
- Incentive a assistir o Dossie ANTES do evento
- Assinatura: Andre Buric

REGRAS:
- Maximo 1500 caracteres
- Tom conversacional de WhatsApp (mensagem, nao email)
- Sem emojis excessivos (maximo 3-4 no total)
- Paragrafos curtos (maximo 2 linhas)
- Linguagem direta, sem rodeios
- NAO invente dados que o aluno nao forneceu
- Se algum dado estiver vazio, nao mencione

Gere APENAS o texto da mensagem, sem explicacoes adicionais.`
}

// ============================================
// FALLBACK MESSAGE
// ============================================

export function getFallbackMessage(nome?: string): string {
  const nomeDisplay = nome || 'participante'
  return `Fala, ${nomeDisplay}! Aqui e o Andre Buric.

Vi que voce garantiu sua vaga na Imersao Diagnostico de Vendas. Decisao importante.

Antes do evento, quero que voce assista ao Dossie de Inteligencia. Sao 7 padroes que travam vendas e que a maioria dos empresarios nem percebe. Vai mudar sua forma de enxergar seu processo comercial.

Nos dias 28/02 e 01/03, tenha o app aberto. Ele vai ser seu painel de controle durante toda a imersao.

Nos vemos la.

Andre Buric`
}

// ============================================
// MESSAGE GENERATOR
// ============================================

export interface WhatsAppMessageResult {
  message: string
  prompt: string
  usedFallback: boolean
}

export async function generateWhatsAppMessage(
  surveyData: SurveyData,
  nome?: string
): Promise<WhatsAppMessageResult> {
  const prompt = buildWhatsAppPrompt(surveyData, nome)

  // TODO: Quando Supabase Edge Function estiver configurada:
  // try {
  //   const response = await fetch('/api/generate-whatsapp-message', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ prompt, surveyData, nome }),
  //   })
  //   if (response.ok) {
  //     const { message } = await response.json()
  //     return { message, prompt, usedFallback: false }
  //   }
  // } catch (error) {
  //   console.error('[WhatsApp Message] API error:', error)
  // }

  // Por enquanto: retorna fallback + prompt (para salvar no DB quando disponivel)
  console.log('[WhatsApp Message] Prompt gerado:', prompt)
  console.log('[WhatsApp Message] Usando mensagem fallback (backend nao configurado)')

  return {
    message: getFallbackMessage(nome),
    prompt,
    usedFallback: true,
  }
}
