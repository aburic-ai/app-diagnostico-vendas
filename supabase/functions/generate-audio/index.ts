/**
 * Edge Function: generate-audio
 *
 * Fluxo:
 * 1. GHL chama via webhook (30 min após compra)
 * 2. Busca survey_response do email/transaction
 * 3. Gera script via OpenAI o1-mini
 * 4. Converte para áudio via ElevenLabs
 * 5. Upload no Supabase Storage
 * 6. Retorna URL para GHL salvar em custom fields
 * 7. GHL envia mensagem WhatsApp com áudio
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateScript, sanitizeScriptForTTS } from './_shared/openai-service.ts'
import { convertTextToSpeech, validateTextLength } from './_shared/elevenlabs-service.ts'
import { uploadAudio, checkBucketHealth } from './_shared/storage-service.ts'
import { updateContactCustomFields, findContactByEmail } from './_shared/ghl-service.ts'
import { generateAudioPrompt, getFallbackScript } from './prompts/audio-script.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers para GHL poder chamar
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // 1. Parsear payload do GHL
    const { email, transaction_id, ghl_contact_id: rawContactId, force } = await req.json()

    // Fallback: se ghl_contact_id não veio, buscar pelo email
    let ghl_contact_id = rawContactId
    if (!ghl_contact_id && email) {
      console.log('[generate-audio] ghl_contact_id não fornecido, buscando por email...')
      const lookup = await findContactByEmail(email)
      if (lookup.contactId) {
        ghl_contact_id = lookup.contactId
      }
    }

    console.log('='.repeat(60))
    console.log('[generate-audio] Nova requisição')
    console.log('[generate-audio] Email:', email)
    console.log('[generate-audio] Transaction:', transaction_id)
    console.log('[generate-audio] GHL Contact ID:', ghl_contact_id, rawContactId ? '(do payload)' : '(lookup por email)')
    console.log('='.repeat(60))

    if (!email && !transaction_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email ou transaction_id é obrigatório',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 2. Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. Verificar se bucket existe
    const bucketHealth = await checkBucketHealth()
    if (!bucketHealth.exists) {
      console.error('[generate-audio] Bucket não existe:', bucketHealth.error)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Storage bucket não configurado',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 4. Buscar survey_response
    console.log('[generate-audio] Buscando survey response...')

    let surveyQuery = supabase
      .from('survey_responses')
      .select(`
        id,
        survey_data,
        email,
        transaction_id,
        profiles:user_id (
          id,
          name,
          email,
          company,
          role
        )
      `)

    if (transaction_id) {
      surveyQuery = surveyQuery.eq('transaction_id', transaction_id)
    } else {
      surveyQuery = surveyQuery.eq('email', email)
    }

    const { data: surveyResponse, error: surveyError } = await surveyQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (surveyError || !surveyResponse) {
      console.error('[generate-audio] Survey não encontrado:', surveyError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Survey não encontrado para este email/transaction',
          reason: 'survey_not_found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log('[generate-audio] ✅ Survey encontrado:', surveyResponse.id)

    // 5. Verificar idempotência (áudio já gerado?)
    const { data: existingAudio } = await supabase
      .from('survey_audio_files')
      .select('id, audio_url, script_generated, status')
      .eq('survey_response_id', surveyResponse.id)
      .single()

    if (existingAudio && existingAudio.status === 'completed' && existingAudio.audio_url && !force) {
      console.log('[generate-audio] ⚠️ Áudio já existe, retornando URL')

      // Atualizar GHL mesmo com cache (pode ter falhado antes)
      if (ghl_contact_id) {
        await updateContactCustomFields(
          ghl_contact_id,
          existingAudio.audio_url,
          existingAudio.script_generated || ''
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          audio_url: existingAudio.audio_url,
          script: existingAudio.script_generated,
          cached: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 6. Criar registro (status = processing)
    const audioRecord = {
      survey_response_id: surveyResponse.id,
      user_id: surveyResponse.profiles?.id,
      transaction_id: surveyResponse.transaction_id,
      email: surveyResponse.email || email,
      ghl_contact_id,
      status: 'processing',
      openai_prompt: '', // Será preenchido depois
    }

    const { data: audioFile, error: insertError } = await supabase
      .from('survey_audio_files')
      .upsert(audioRecord, { onConflict: 'survey_response_id' })
      .select()
      .single()

    if (insertError || !audioFile) {
      console.error('[generate-audio] Erro ao criar registro:', insertError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao criar registro de áudio',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('[generate-audio] Registro criado:', audioFile.id)

    // 7. Gerar prompt
    const userProfile = {
      name: surveyResponse.profiles?.name || 'participante',
      company: surveyResponse.profiles?.company,
      role: surveyResponse.profiles?.role,
    }

    const surveyData = surveyResponse.survey_data as {
      modeloNegocio: string
      faturamento: string
      ondeTrava: string
      tentativasAnteriores: string
      investimentoAnterior: string
      cursosAnteriores: string
      problemaPrincipal: string
      interessePos: string
    }

    const prompt = generateAudioPrompt(surveyData, userProfile)

    // Atualizar prompt no banco
    await supabase
      .from('survey_audio_files')
      .update({ openai_prompt: prompt })
      .eq('id', audioFile.id)

    // 8. Gerar script via OpenAI
    console.log('[generate-audio] Gerando script via OpenAI...')
    const scriptResult = await generateScript(prompt)

    let finalScript: string

    if (!scriptResult.success || !scriptResult.script) {
      console.warn('[generate-audio] ⚠️ OpenAI falhou, usando fallback')
      finalScript = getFallbackScript(userProfile.name)
    } else {
      finalScript = scriptResult.script
    }

    console.log('[generate-audio] Script gerado:', finalScript.substring(0, 100) + '...')

    // Sanitizar para TTS
    const sanitizedScript = sanitizeScriptForTTS(finalScript)

    // Validar tamanho
    const validation = validateTextLength(sanitizedScript)
    if (!validation.valid) {
      console.error('[generate-audio] Script inválido:', validation.error)
      await supabase
        .from('survey_audio_files')
        .update({
          status: 'failed',
          error_message: validation.error,
        })
        .eq('id', audioFile.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 9. Converter para áudio via ElevenLabs
    console.log('[generate-audio] Convertendo para áudio via ElevenLabs...')
    const audioResult = await convertTextToSpeech(sanitizedScript)

    if (!audioResult.success || !audioResult.audioBuffer) {
      console.error('[generate-audio] ElevenLabs falhou:', audioResult.error)
      await supabase
        .from('survey_audio_files')
        .update({
          status: 'failed',
          error_message: `ElevenLabs error: ${audioResult.error}`,
        })
        .eq('id', audioFile.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: audioResult.error,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 10. Upload para Storage
    console.log('[generate-audio] Fazendo upload para Storage...')
    const uploadResult = await uploadAudio(
      audioResult.audioBuffer,
      audioFile.user_id || 'anonymous',
      audioFile.email
    )

    if (!uploadResult.success || !uploadResult.publicUrl) {
      console.error('[generate-audio] Upload falhou:', uploadResult.error)
      await supabase
        .from('survey_audio_files')
        .update({
          status: 'failed',
          error_message: `Storage error: ${uploadResult.error}`,
        })
        .eq('id', audioFile.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: uploadResult.error,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // 11. Atualizar registro (status = completed)
    await supabase
      .from('survey_audio_files')
      .update({
        audio_url: uploadResult.publicUrl,
        audio_duration_seconds: audioResult.duration,
        script_generated: finalScript,
        elevenlabs_voice_id: Deno.env.get('ELEVENLABS_VOICE_ID'),
        elevenlabs_request_id: audioResult.requestId,
        openai_model: 'gpt-4o-mini',
        openai_request_id: scriptResult.requestId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', audioFile.id)

    // 12. Atualizar custom fields do contato no GHL
    if (ghl_contact_id) {
      console.log('[generate-audio] Atualizando contato no GHL...')
      const ghlResult = await updateContactCustomFields(
        ghl_contact_id,
        uploadResult.publicUrl,
        finalScript
      )

      if (ghlResult.success) {
        console.log('[generate-audio] ✅ GHL atualizado!')
        // Salvar referência no banco
        await supabase
          .from('survey_audio_files')
          .update({
            ghl_custom_field_audio_url: uploadResult.publicUrl,
            ghl_custom_field_script: finalScript,
          })
          .eq('id', audioFile.id)
      } else {
        console.warn('[generate-audio] ⚠️ Falha ao atualizar GHL:', ghlResult.error)
      }
    } else {
      console.warn('[generate-audio] ⚠️ Sem ghl_contact_id, pulando atualização GHL')
    }

    // 13. Envio do áudio via WhatsApp é feito pelo Workflow do GHL
    // (precisa da janela 24h aberta — pessoa responde "ok" primeiro)

    const totalTime = Date.now() - startTime

    console.log('='.repeat(60))
    console.log('[generate-audio] ✅ SUCESSO')
    console.log('[generate-audio] Audio URL:', uploadResult.publicUrl)
    console.log('[generate-audio] Total time:', totalTime, 'ms')
    console.log('='.repeat(60))

    // 13. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        audio_url: uploadResult.publicUrl,
        script: finalScript,
        duration_seconds: audioResult.duration,
        processing_time_ms: totalTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[generate-audio] ❌ Erro fatal:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
