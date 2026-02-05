/**
 * Edge Function: send-whatsapp-audio
 *
 * Chamada pelo GHL Workflow (Webhook action) após o contato responder "ok".
 * 1. Recebe dados do contato via webhook do GHL
 * 2. Busca audio_url na tabela survey_audio_files (Supabase)
 * 3. Baixa o arquivo de áudio (OGG Opus) do Supabase Storage
 * 4. Faz upload do áudio para o GHL (POST /conversations/messages/upload)
 * 5. Envia mensagem WhatsApp com messageType "Audio" (áudio nativo)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GHL_API_KEY = Deno.env.get('GHL_API_KEY')
const GHL_API_BASE = 'https://services.leadconnectorhq.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()

    // O GHL Webhook envia os dados do contato.
    const contactId = payload.contact_id || payload.contactId || payload.id
    const email = payload.email || payload.contact?.email

    console.log('='.repeat(60))
    console.log('[send-whatsapp-audio] Nova requisição')
    console.log('[send-whatsapp-audio] Contact ID:', contactId)
    console.log('[send-whatsapp-audio] Email:', email)
    console.log('[send-whatsapp-audio] Payload keys:', Object.keys(payload).join(', '))
    console.log('='.repeat(60))

    if (!contactId) {
      return new Response(
        JSON.stringify({ success: false, error: 'contact_id não encontrado no payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'email não encontrado no payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!GHL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'GHL_API_KEY não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 1. Buscar áudio no Supabase pelo email
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: audioFile, error: dbError } = await supabase
      .from('survey_audio_files')
      .select('audio_url, script_generated, status')
      .eq('email', email)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !audioFile) {
      console.error('[send-whatsapp-audio] Áudio não encontrado:', dbError)
      return new Response(
        JSON.stringify({ success: false, error: 'Áudio não encontrado para este email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (!audioFile.audio_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'audio_url está vazio no registro' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('[send-whatsapp-audio] Audio URL do Supabase:', audioFile.audio_url)

    // Detectar formato do áudio (OGG ou MP3 para backward compat)
    const isOgg = audioFile.audio_url.endsWith('.ogg')
    const mimeType = isOgg ? 'audio/ogg' : 'audio/mpeg'
    const fileName = isOgg ? 'diagnostico-audio.ogg' : 'diagnostico-audio.mp3'

    console.log('[send-whatsapp-audio] Formato detectado:', mimeType, '| Arquivo:', fileName)

    // 2. Baixar o arquivo de áudio do Supabase Storage
    console.log('[send-whatsapp-audio] Baixando áudio do Supabase Storage...')
    const audioResponse = await fetch(audioFile.audio_url)

    if (!audioResponse.ok) {
      console.error('[send-whatsapp-audio] Erro ao baixar áudio:', audioResponse.status)
      return new Response(
        JSON.stringify({ success: false, error: 'Falha ao baixar áudio do Storage' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    console.log('[send-whatsapp-audio] Áudio baixado:', audioBuffer.byteLength, 'bytes')

    // 3. Upload do áudio para o GHL
    console.log('[send-whatsapp-audio] Fazendo upload para o GHL...')

    const formData = new FormData()
    formData.append('contactId', contactId)
    formData.append(
      'fileAttachment',
      new Blob([audioBuffer], { type: mimeType }),
      fileName
    )

    const uploadResponse = await fetch(`${GHL_API_BASE}/conversations/messages/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-04-15',
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('[send-whatsapp-audio] Erro no upload GHL:', uploadResponse.status, errorText)
      return new Response(
        JSON.stringify({
          success: false,
          error: `GHL upload error: ${uploadResponse.status}`,
          details: errorText,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const uploadData = await uploadResponse.json()
    console.log('[send-whatsapp-audio] Upload GHL resposta:', JSON.stringify(uploadData))

    // Extrair URL do upload — formato: { uploadedFiles: { "filename.ogg": "url" } }
    let ghlAudioUrl: string | null = null
    if (uploadData.uploadedFiles) {
      const urls = Object.values(uploadData.uploadedFiles) as string[]
      ghlAudioUrl = urls[0] || null
    }

    if (!ghlAudioUrl) {
      console.error('[send-whatsapp-audio] URL não retornada pelo GHL upload:', uploadData)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GHL upload não retornou URL',
          uploadResponse: uploadData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    console.log('[send-whatsapp-audio] GHL Audio URL:', ghlAudioUrl)

    // 4. Enviar mensagem WhatsApp com messageType "Audio"
    // Formato correto para áudio nativo no WhatsApp (bolinha de play)
    console.log('[send-whatsapp-audio] Enviando áudio via WhatsApp (messageType: Audio)...')

    const sendPayload = {
      type: 'WhatsApp',
      contactId,
      messageType: 'Audio',
      attachments: [ghlAudioUrl],
    }
    console.log('[send-whatsapp-audio] Send payload:', JSON.stringify(sendPayload))

    const sendResponse = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15',
      },
      body: JSON.stringify(sendPayload),
    })

    if (sendResponse.ok) {
      const sendData = await sendResponse.json()
      console.log('[send-whatsapp-audio] ✅ Áudio enviado (nativo)!', sendData?.messageId || '')

      return new Response(
        JSON.stringify({
          success: true,
          messageId: sendData?.messageId,
          ghl_audio_url: ghlAudioUrl,
          method: 'native_audio',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Tentativa 1 falhou — logar e tentar URL direta do Supabase
    const attempt1Error = await sendResponse.text()
    console.warn('[send-whatsapp-audio] Tentativa 1 (GHL URL + messageType) falhou:', sendResponse.status, attempt1Error)

    // Tentativa 2: URL direta do Supabase com messageType Audio
    console.log('[send-whatsapp-audio] Tentativa 2: URL direta do Supabase...')

    const sendPayload2 = {
      type: 'WhatsApp',
      contactId,
      messageType: 'Audio',
      attachments: [audioFile.audio_url],
    }
    console.log('[send-whatsapp-audio] Send payload 2:', JSON.stringify(sendPayload2))

    const sendResponse2 = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15',
      },
      body: JSON.stringify(sendPayload2),
    })

    if (sendResponse2.ok) {
      const sendData2 = await sendResponse2.json()
      console.log('[send-whatsapp-audio] ✅ Áudio enviado (URL Supabase)!', sendData2?.messageId || '')

      return new Response(
        JSON.stringify({
          success: true,
          messageId: sendData2?.messageId,
          ghl_audio_url: audioFile.audio_url,
          method: 'supabase_url_audio',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const attempt2Error = await sendResponse2.text()
    console.warn('[send-whatsapp-audio] Tentativa 2 falhou:', sendResponse2.status, attempt2Error)

    // Tentativa 3: attachments sem messageType (formato antigo)
    console.log('[send-whatsapp-audio] Tentativa 3: attachments sem messageType...')

    const sendPayload3 = {
      type: 'WhatsApp',
      contactId,
      attachments: [ghlAudioUrl],
    }

    const sendResponse3 = await fetch(`${GHL_API_BASE}/conversations/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-04-15',
      },
      body: JSON.stringify(sendPayload3),
    })

    if (sendResponse3.ok) {
      const sendData3 = await sendResponse3.json()
      console.log('[send-whatsapp-audio] ✅ Áudio enviado (sem messageType)!', sendData3?.messageId || '')

      return new Response(
        JSON.stringify({
          success: true,
          messageId: sendData3?.messageId,
          ghl_audio_url: ghlAudioUrl,
          method: 'attachments_only',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const attempt3Error = await sendResponse3.text()
    console.error('[send-whatsapp-audio] Todas as tentativas falharam')

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Todas as tentativas de envio falharam',
        attempt1: attempt1Error,
        attempt2: attempt2Error,
        attempt3: attempt3Error,
        ghl_audio_url: ghlAudioUrl,
        supabase_audio_url: audioFile.audio_url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
    )
  } catch (error) {
    console.error('[send-whatsapp-audio] Erro:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
