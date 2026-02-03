/**
 * Chat Completion Edge Function
 *
 * Processa mensagens do chat IA durante o evento
 * - Busca contexto completo (survey + diagnóstico + histórico)
 * - Chama GPT-4o-mini com prompt personalizado
 * - Salva mensagens em tempo real
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const OPENAI_ASSISTANT_ID = Deno.env.get('OPENAI_ASSISTANT_ID') // Opcional: se não existir, usa chat completion
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ============================================
    // 1. PARSE REQUEST
    // ============================================
    const {
      user_id,
      conversation_id,
      message,
      event_day,
      module_id,
    } = await req.json()

    console.log('[chat-completion] Request:', { user_id, conversation_id, event_day, module_id })

    if (!user_id || !message || !conversation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, message, conversation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ============================================
    // 2. FETCH USER CONTEXT (OPCIONAL - chat funciona sem)
    // ============================================

    // 2.1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, business_type')
      .eq('id', user_id)
      .maybeSingle()

    // 2.2. Survey responses (OPCIONAL)
    const { data: surveyData } = await supabase
      .from('survey_responses')
      .select('survey_data')
      .eq('user_id', user_id)
      .maybeSingle()

    const survey = surveyData?.survey_data || {}

    // 2.3. Diagnostic IMPACT scores (OPCIONAL)
    const { data: diagnostics } = await supabase
      .from('diagnostic_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('event_day', { ascending: true })

    // 2.4. Chat history (últimas 20 mensagens da conversa)
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    if (historyError) {
      console.error('[chat-completion] History error:', historyError)
    }

    // ============================================
    // 3. CALCULATE BOTTLENECK (GARGALO)
    // ============================================

    let gargalo = { etapa: 'Conversão', valor: 0 }

    if (diagnostics && diagnostics.length > 0) {
      const latestDiag = diagnostics[diagnostics.length - 1]
      const scores = [
        { etapa: 'Inspiração', valor: latestDiag.inspiracao || 0 },
        { etapa: 'Motivação', valor: latestDiag.motivacao || 0 },
        { etapa: 'Preparação', valor: latestDiag.preparacao || 0 },
        { etapa: 'Apresentação', valor: latestDiag.apresentacao || 0 },
        { etapa: 'Conversão', valor: latestDiag.conversao || 0 },
        { etapa: 'Transformação', valor: latestDiag.transformacao || 0 },
      ]
      gargalo = scores.reduce((min, curr) => curr.valor < min.valor ? curr : min)
    }

    console.log('[chat-completion] Gargalo:', gargalo)

    // ============================================
    // 4. BUILD SYSTEM PROMPT
    // ============================================

    const systemPrompt = `Você é um consultor especialista em vendas B2B ajudando ${profile?.name || 'o participante'} durante a Imersão Diagnóstico de Vendas ao vivo.

CONTEXTO DO PARTICIPANTE:
- Nome: ${profile?.name || 'Participante'}
- Tipo de negócio: ${profile?.business_type || survey?.modeloNegocio || 'B2B/Consultoria'}
${survey?.faturamento ? `- Faturamento mensal: ${survey.faturamento}` : ''}
${survey?.ondeTrava ? `- Onde trava: ${survey.ondeTrava}` : ''}
${survey?.problemaPrincipal ? `- Problema principal: ${survey.problemaPrincipal}` : ''}
${survey?.tentativasAnteriores ? `- Tentativas anteriores: ${survey.tentativasAnteriores}` : ''}

DIAGNÓSTICO IMPACT:
${diagnostics && diagnostics.length > 0 ? `
- Inspiração: ${diagnostics[diagnostics.length - 1]?.inspiracao || 0}/10
- Motivação: ${diagnostics[diagnostics.length - 1]?.motivacao || 0}/10
- Preparação: ${diagnostics[diagnostics.length - 1]?.preparacao || 0}/10
- Apresentação: ${diagnostics[diagnostics.length - 1]?.apresentacao || 0}/10
- Conversão: ${diagnostics[diagnostics.length - 1]?.conversao || 0}/10
- Transformação: ${diagnostics[diagnostics.length - 1]?.transformacao || 0}/10
🎯 Gargalo principal: ${gargalo.etapa} (${gargalo.valor}/10)
` : '(Diagnóstico ainda não preenchido - incentive o participante a preencher)'}


SUA FUNÇÃO:
1. Simular objeções reais de clientes de forma dura e realista
2. Analisar pitches e scripts criticamente (sem elogios gratuitos)
3. Treinar comando de vendas e senso de urgência
4. Focar no gargalo: ${gargalo.etapa}

TOM:
- Direto e prático (sem enrolação)
- Use exemplos concretos do negócio dele
- Evite jargões vazios
- Seja crítico mas construtivo
- Máximo 200 palavras por resposta

IMPORTANTE:
- NÃO venda nada (ele já comprou o evento)
- NÃO elogie sem razão
- Seja exigente como um cliente difícil seria
- Foque em ação, não teoria`

    // ============================================
    // 5. CALL OPENAI (Assistant ou Chat Completion)
    // ============================================

    let assistantMessage: string
    let tokensUsed: number

    if (OPENAI_ASSISTANT_ID) {
      // ============================================
      // MODO ASSISTANT (Prompt fixo no OpenAI)
      // ============================================
      console.log('[chat-completion] Using OpenAI Assistant:', OPENAI_ASSISTANT_ID)

      // 5.1. Criar ou buscar Thread (salvo na conversation)
      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('openai_thread_id')
        .eq('id', conversation_id)
        .single()

      let threadId = convData?.openai_thread_id

      if (!threadId) {
        // Criar novo thread
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        })

        const threadData = await threadResponse.json()
        threadId = threadData.id

        // Salvar thread_id na conversation
        await supabase
          .from('chat_conversations')
          .update({ openai_thread_id: threadId })
          .eq('id', conversation_id)

        console.log('[chat-completion] Created new thread:', threadId)
      }

      // 5.2. Adicionar mensagem do usuário ao thread
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          role: 'user',
          content: message,
        }),
      })

      // 5.3. Criar e executar Run
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: OPENAI_ASSISTANT_ID,
        }),
      })

      const runData = await runResponse.json()
      const runId = runData.id

      // 5.4. Aguardar conclusão do Run (polling)
      let runStatus = 'queued'
      let attempts = 0
      const maxAttempts = 30

      while (runStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 segundo

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        })

        const statusData = await statusResponse.json()
        runStatus = statusData.status

        if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
          throw new Error(`Run failed with status: ${runStatus}`)
        }

        attempts++
      }

      if (runStatus !== 'completed') {
        throw new Error('Run timeout')
      }

      // 5.5. Buscar mensagens do thread (última é a resposta)
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      })

      const messagesData = await messagesResponse.json()
      const lastMessage = messagesData.data[0]

      assistantMessage = lastMessage.content[0].text.value
      tokensUsed = 0 // Assistants não retornam tokens diretamente

      console.log('[chat-completion] Assistant response received')
    } else {
      // ============================================
      // MODO CHAT COMPLETION (Prompt dinâmico)
      // ============================================
      console.log('[chat-completion] Using Chat Completion')

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(chatHistory || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ]

      console.log('[chat-completion] Calling OpenAI with', messages.length, 'messages')

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 400,
        }),
      })

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text()
        console.error('[chat-completion] OpenAI error:', errorText)
        throw new Error(`OpenAI error: ${openaiResponse.status}`)
      }

      const openaiData = await openaiResponse.json()
      assistantMessage = openaiData.choices[0].message.content
      tokensUsed = openaiData.usage.total_tokens

      console.log('[chat-completion] OpenAI response:', { tokensUsed })
    }

    // ============================================
    // 6. SAVE MESSAGES TO DATABASE
    // ============================================

    // 6.1. Save user message
    const { error: userMsgError } = await supabase.from('chat_messages').insert({
      conversation_id,
      user_id,
      role: 'user',
      content: message,
      event_day,
      module_id,
    })

    if (userMsgError) {
      console.error('[chat-completion] Error saving user message:', userMsgError)
    }

    // 6.2. Save assistant response
    const { error: assistantMsgError } = await supabase.from('chat_messages').insert({
      conversation_id,
      user_id,
      role: 'assistant',
      content: assistantMessage,
      tokens_used: tokensUsed,
      event_day,
      module_id,
    })

    if (assistantMsgError) {
      console.error('[chat-completion] Error saving assistant message:', assistantMsgError)
    }

    // 6.3. Update conversation stats
    const { error: convUpdateError } = await supabase
      .from('chat_conversations')
      .update({
        total_messages: (chatHistory?.length || 0) + 2,
        total_tokens_used: tokensUsed,
      })
      .eq('id', conversation_id)

    if (convUpdateError) {
      console.error('[chat-completion] Error updating conversation:', convUpdateError)
    }

    // ============================================
    // 7. RETURN RESPONSE
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        tokens_used: tokensUsed,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('[chat-completion] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
