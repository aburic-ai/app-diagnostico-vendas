/**
 * GHL (Go High Level) Service
 * - Atualizar custom fields do contato (audio_url e script)
 * - Enviar áudio via WhatsApp (Conversations API)
 *
 * GOTCHA: A API do GHL aceita silenciosamente payloads com keys/ids incorretos
 * (retorna succeded:true) mas NÃO atualiza os campos.
 * É necessário usar o UUID interno do campo (obtido via GET /locations/.../customFields).
 * A propriedade "key" NÃO funciona — somente "id" (UUID) atualiza de fato.
 */

const GHL_API_KEY = Deno.env.get('GHL_API_KEY')
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')
const GHL_API_BASE = 'https://services.leadconnectorhq.com'

// Custom field keys - devem bater com o configurado no GHL
const CUSTOM_FIELD_AUDIO_URL = 'audio_diagnosticovendas_url'
const CUSTOM_FIELD_AUDIO_SCRIPT = 'imdiagnosticovendas_audio_script'

interface GHLUpdateResult {
  success: boolean
  contactId?: string
  error?: string
}

/**
 * Buscar contato no GHL por email
 * Retorna o contactId se encontrado
 */
export async function findContactByEmail(
  email: string
): Promise<{ contactId: string | null; error?: string }> {
  if (!GHL_API_KEY) {
    return { contactId: null, error: 'GHL_API_KEY not configured' }
  }
  if (!GHL_LOCATION_ID) {
    console.warn('[GHL] GHL_LOCATION_ID não configurado, não é possível buscar contato por email')
    return { contactId: null, error: 'GHL_LOCATION_ID not configured' }
  }

  try {
    console.log('[GHL] Buscando contato por email:', email)

    const url = `${GHL_API_BASE}/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] Erro ao buscar contato:', response.status, errorText)
      return { contactId: null, error: `Search error: ${response.status}` }
    }

    const data = await response.json()
    const contact = data?.contact

    if (contact?.id) {
      console.log('[GHL] ✅ Contato encontrado:', contact.id)
      return { contactId: contact.id }
    }

    console.warn('[GHL] Contato não encontrado para email:', email)
    return { contactId: null }
  } catch (error) {
    console.error('[GHL] Erro ao buscar contato:', error)
    return {
      contactId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Buscar os UUIDs dos custom fields na location do GHL.
 * A API exige o UUID interno, não o nome/key do campo.
 */
async function resolveCustomFieldIds(): Promise<{
  audioUrlId: string | null
  scriptId: string | null
}> {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.warn('[GHL] API key ou Location ID não configurados, não é possível resolver field IDs')
    return { audioUrlId: null, scriptId: null }
  }

  try {
    // Tentar o endpoint de custom fields v2 (com model=contact)
    const url = `${GHL_API_BASE}/locations/${GHL_LOCATION_ID}/customFields?model=contact`
    console.log('[GHL] Buscando custom fields da location:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] Erro ao buscar custom fields:', response.status, errorText)
      return { audioUrlId: null, scriptId: null }
    }

    const data = await response.json()
    const fields = data?.customFields || []
    console.log('[GHL] Total custom fields encontrados:', fields.length)

    let audioUrlId: string | null = null
    let scriptId: string | null = null

    for (const field of fields) {
      const fKey = (field.fieldKey || field.key || '').toLowerCase()
      const fName = (field.name || '').toLowerCase()
      const fId = field.id || ''

      // Log cada campo para debug
      console.log(`[GHL] Field: ${fName} | key: ${fKey} | id: ${fId}`)

      if (
        fKey.includes(CUSTOM_FIELD_AUDIO_URL) ||
        fName.includes('audio_diagnosticovendas')
      ) {
        audioUrlId = fId
        console.log('[GHL] ✅ Match audio URL field:', fId)
      }
      if (
        fKey.includes(CUSTOM_FIELD_AUDIO_SCRIPT) ||
        fName.includes('imdiagnosticovendas_audio_script')
      ) {
        scriptId = fId
        console.log('[GHL] ✅ Match script field:', fId)
      }
    }

    if (!audioUrlId || !scriptId) {
      console.warn('[GHL] ⚠️ Nem todos os campos foram encontrados via /customFields')
      console.warn('[GHL] audioUrlId:', audioUrlId, '| scriptId:', scriptId)
    }

    return { audioUrlId, scriptId }
  } catch (error) {
    console.error('[GHL] Erro ao resolver custom field IDs:', error)
    return { audioUrlId: null, scriptId: null }
  }
}

/**
 * Buscar custom fields diretamente do contato (GET /contacts/{id})
 * e logar todos para debug.
 */
async function getContactCustomFields(
  contactId: string
): Promise<Array<{ id: string; value: unknown }>> {
  try {
    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
      },
    })

    if (!response.ok) {
      console.error('[GHL] GET contact failed:', response.status)
      return []
    }

    const data = await response.json()
    const fields = data?.contact?.customFields || []

    console.log('[GHL] Custom fields do contato (' + fields.length + ' campos):')
    for (const f of fields) {
      const val = typeof f.value === 'string'
        ? f.value.substring(0, 80)
        : JSON.stringify(f.value)
      console.log(`[GHL]   id: ${f.id} | value: ${val}`)
    }

    return fields
  } catch (error) {
    console.error('[GHL] Erro ao buscar contato:', error)
    return []
  }
}

/**
 * Atualizar custom fields de um contato no GHL.
 * Primeiro resolve os UUIDs dos campos, depois faz PUT com esses UUIDs.
 */
export async function updateContactCustomFields(
  contactId: string,
  audioUrl: string,
  script: string
): Promise<GHLUpdateResult> {
  if (!GHL_API_KEY) {
    console.error('[GHL] API key not configured (GHL_API_KEY)')
    return { success: false, error: 'GHL_API_KEY not configured' }
  }

  if (!contactId) {
    console.warn('[GHL] No contact ID provided, skipping update')
    return { success: false, error: 'No contact ID provided' }
  }

  try {
    // Step 1: Buscar UUIDs dos custom fields
    console.log('[GHL] === Step 1: Resolvendo custom field IDs ===')
    const { audioUrlId, scriptId } = await resolveCustomFieldIds()

    // Step 2: Logar custom fields atuais do contato (para debug)
    console.log('[GHL] === Step 2: Custom fields atuais do contato ===')
    await getContactCustomFields(contactId)

    // Step 3: Montar payload com UUIDs (ou fallback para key)
    console.log('[GHL] === Step 3: Atualizando custom fields ===')

    const customFields = []

    if (audioUrlId) {
      customFields.push({ id: audioUrlId, field_value: audioUrl })
      console.log('[GHL] Usando UUID para audio_url:', audioUrlId)
    } else {
      customFields.push({ key: CUSTOM_FIELD_AUDIO_URL, field_value: audioUrl })
      console.warn('[GHL] ⚠️ UUID não encontrado para audio_url, usando key como fallback')
    }

    if (scriptId) {
      customFields.push({ id: scriptId, field_value: script })
      console.log('[GHL] Usando UUID para script:', scriptId)
    } else {
      customFields.push({ key: CUSTOM_FIELD_AUDIO_SCRIPT, field_value: script })
      console.warn('[GHL] ⚠️ UUID não encontrado para script, usando key como fallback')
    }

    console.log('[GHL] Atualizando contato:', contactId)
    console.log('[GHL] Custom fields payload:', JSON.stringify(customFields))

    const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({ customFields }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] API error:', response.status, errorText)
      return {
        success: false,
        error: `GHL API error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()
    console.log('[GHL] ✅ Contato atualizado com sucesso')

    // Logar custom fields da resposta para verificar se atualizou
    const updatedFields = data?.contact?.customFields || []
    console.log('[GHL] Custom fields após update (' + updatedFields.length + ' campos):')
    for (const f of updatedFields) {
      const val = typeof f.value === 'string'
        ? f.value.substring(0, 80)
        : JSON.stringify(f.value)
      console.log(`[GHL]   id: ${f.id} | value: ${val}`)
    }

    return { success: true, contactId }
  } catch (error) {
    console.error('[GHL] Erro ao atualizar contato:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Enviar áudio via WhatsApp usando a Conversations API do GHL.
 * Envia o audio_url como attachment de mídia (aparece como áudio nativo no WhatsApp).
 *
 * IMPORTANTE: Só funciona dentro da janela de 24h do WhatsApp Business.
 * Se o contato não interagiu nas últimas 24h, precisa enviar template primeiro.
 */
export async function sendWhatsAppAudio(
  contactId: string,
  audioUrl: string,
  messageText?: string
): Promise<GHLUpdateResult> {
  if (!GHL_API_KEY) {
    console.error('[GHL] API key not configured (GHL_API_KEY)')
    return { success: false, error: 'GHL_API_KEY not configured' }
  }

  if (!contactId) {
    console.warn('[GHL] No contact ID provided, skipping WhatsApp send')
    return { success: false, error: 'No contact ID provided' }
  }

  if (!audioUrl) {
    console.warn('[GHL] No audio URL provided, skipping WhatsApp send')
    return { success: false, error: 'No audio URL provided' }
  }

  try {
    console.log('[GHL] === Enviando áudio via WhatsApp ===')
    console.log('[GHL] Contact:', contactId)
    console.log('[GHL] Audio URL:', audioUrl)

    // Enviar texto primeiro (se houver), depois o áudio separado
    // WhatsApp não suporta caption em áudio
    if (messageText) {
      console.log('[GHL] Enviando mensagem de texto antes do áudio...')
      const textResponse = await fetch(`${GHL_API_BASE}/conversations/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify({
          type: 'WhatsApp',
          contactId,
          message: messageText,
        }),
      })

      if (!textResponse.ok) {
        const errorText = await textResponse.text()
        console.warn('[GHL] Falha ao enviar texto:', textResponse.status, errorText)
      } else {
        const textData = await textResponse.json()
        console.log('[GHL] ✅ Texto enviado:', textData?.messageId || 'ok')
      }
    }

    // Enviar áudio como attachment
    const response = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15',
      },
      body: JSON.stringify({
        type: 'WhatsApp',
        contactId,
        attachments: [audioUrl],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[GHL] Erro ao enviar áudio WhatsApp:', response.status, errorText)
      return {
        success: false,
        error: `WhatsApp send error: ${response.status} - ${errorText}`,
      }
    }

    const data = await response.json()
    console.log('[GHL] ✅ Áudio WhatsApp enviado:', data?.messageId || 'ok')

    return { success: true, contactId }
  } catch (error) {
    console.error('[GHL] Erro ao enviar áudio WhatsApp:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
