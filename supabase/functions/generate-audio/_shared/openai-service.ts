/**
 * OpenAI Service - Integração com o1-mini
 * Gera scripts personalizados baseados em respostas do survey
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  max_tokens?: number
  temperature?: number
}

interface OpenAIResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function generateScript(prompt: string): Promise<{
  success: boolean
  script?: string
  requestId?: string
  error?: string
  tokensUsed?: number
}> {
  if (!OPENAI_API_KEY) {
    console.error('[OpenAI] API key not configured')
    return {
      success: false,
      error: 'OpenAI API key not configured',
    }
  }

  try {
    console.log('[OpenAI] Gerando script com o1-mini...')
    console.log('[OpenAI] Prompt length:', prompt.length)

    const requestBody: OpenAIRequest = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OpenAI] API error:', response.status, errorText)
      return {
        success: false,
        error: `OpenAI API error: ${response.status} - ${errorText}`,
      }
    }

    const data: OpenAIResponse = await response.json()

    const script = data.choices[0]?.message?.content?.trim()

    if (!script) {
      console.error('[OpenAI] Empty script generated')
      return {
        success: false,
        error: 'Empty script generated',
      }
    }

    console.log('[OpenAI] ✅ Script gerado com sucesso')
    console.log('[OpenAI] Script length:', script.length)
    console.log('[OpenAI] Tokens used:', data.usage?.total_tokens)
    console.log('[OpenAI] Request ID:', data.id)

    // Validar tamanho do script (400-800 caracteres ideal)
    if (script.length < 200) {
      console.warn('[OpenAI] ⚠️ Script muito curto:', script.length, 'chars')
    } else if (script.length > 1000) {
      console.warn('[OpenAI] ⚠️ Script muito longo:', script.length, 'chars')
    }

    return {
      success: true,
      script,
      requestId: data.id,
      tokensUsed: data.usage?.total_tokens,
    }
  } catch (error) {
    console.error('[OpenAI] Erro ao gerar script:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sanitizar script para TTS
 * Remove markdown, URLs, caracteres especiais
 */
export function sanitizeScriptForTTS(script: string): string {
  return script
    // Remove markdown
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/__(.*?)__/g, '$1') // Underline
    .replace(/~~(.*?)~~/g, '$1') // Strikethrough

    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')

    // Remove emojis (opcional - ElevenLabs ignora de qualquer forma)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')

    // Normalizar espaços
    .replace(/\s+/g, ' ')
    .trim()
}
