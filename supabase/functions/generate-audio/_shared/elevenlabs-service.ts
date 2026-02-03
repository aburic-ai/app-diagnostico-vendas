/**
 * ElevenLabs Service - Conversão Text-to-Speech
 * Usa voz clonada do André Buric
 */

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
const ELEVENLABS_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID') || 'K0Yk2ESZ2dsYv9RrtThg'
const ELEVENLABS_MODEL = 'eleven_turbo_v3' // Melhor modelo para voz clonada + emotion tags
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style?: number
  use_speaker_boost?: boolean
}

interface ElevenLabsRequest {
  text: string
  model_id: string
  voice_settings: VoiceSettings
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5, // 0-1: Menos estável = mais variação/emoção
  similarity_boost: 0.75, // 0-1: Mais alto = mais parecido com voz original
  style: 0.0, // 0-1: Exagero de estilo (0 = neutro)
  use_speaker_boost: true, // Melhora similaridade
}

export async function convertTextToSpeech(text: string): Promise<{
  success: boolean
  audioBuffer?: Uint8Array
  requestId?: string
  duration?: number
  error?: string
}> {
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] API key not configured')
    return {
      success: false,
      error: 'ElevenLabs API key not configured',
    }
  }

  try {
    console.log('[ElevenLabs] Convertendo texto para áudio...')
    console.log('[ElevenLabs] Text length:', text.length)
    console.log('[ElevenLabs] Voice ID:', ELEVENLABS_VOICE_ID)

    const requestBody: ElevenLabsRequest = {
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: DEFAULT_VOICE_SETTINGS,
    }

    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ElevenLabs] API error:', response.status, errorText)
      return {
        success: false,
        error: `ElevenLabs API error: ${response.status} - ${errorText}`,
      }
    }

    // Extrair request ID do header (se disponível)
    const requestId = response.headers.get('request-id') || undefined

    // Ler stream de áudio
    const audioBuffer = new Uint8Array(await response.arrayBuffer())

    console.log('[ElevenLabs] ✅ Áudio gerado com sucesso')
    console.log('[ElevenLabs] Audio size:', (audioBuffer.length / 1024).toFixed(2), 'KB')
    console.log('[ElevenLabs] Request ID:', requestId)

    // Estimar duração (aproximado: 1000 chars ≈ 75s)
    const estimatedDuration = Math.round((text.length / 1000) * 75)

    return {
      success: true,
      audioBuffer,
      requestId,
      duration: estimatedDuration,
    }
  } catch (error) {
    console.error('[ElevenLabs] Erro ao converter texto:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validar tamanho do texto antes de enviar
 * ElevenLabs tem limite de ~5000 caracteres por request
 */
export function validateTextLength(text: string): {
  valid: boolean
  error?: string
} {
  const MAX_LENGTH = 5000
  const MIN_LENGTH = 50

  if (text.length < MIN_LENGTH) {
    return {
      valid: false,
      error: `Texto muito curto (${text.length} chars). Mínimo: ${MIN_LENGTH}`,
    }
  }

  if (text.length > MAX_LENGTH) {
    return {
      valid: false,
      error: `Texto muito longo (${text.length} chars). Máximo: ${MAX_LENGTH}`,
    }
  }

  return { valid: true }
}

/**
 * Calcular custo estimado
 * ElevenLabs cobra por caractere: $0.30 per 1K chars (Professional plan)
 */
export function estimateCost(textLength: number): number {
  const COST_PER_1K_CHARS = 0.30
  return (textLength / 1000) * COST_PER_1K_CHARS
}
