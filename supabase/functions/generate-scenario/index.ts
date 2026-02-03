/**
 * Generate Scenario Projection Edge Function
 *
 * Gera projeções personalizadas 30-60-90 dias
 * - Busca TODOS os dados (survey + diagnóstico + chat)
 * - Chama GPT-4o-mini com mega-prompt
 * - Retorna cenários customizados
 * - Cacheia resultado por 24h
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[generate-scenario] Function invoked! Method:', req.method)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[generate-scenario] CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[generate-scenario] Parsing request body...')
    const { user_id, force_regenerate } = await req.json()

    console.log('[generate-scenario] Request:', { user_id, force_regenerate })

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // ============================================
    // 1. CHECK CACHE (se não forçar regeneração)
    // ============================================

    if (!force_regenerate) {
      const { data: existing, error: existingError } = await supabase
        .from('scenario_projections')
        .select('*')
        .eq('user_id', user_id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('[generate-scenario] Error checking cache:', existingError)
      }

      // Se existe e foi gerado há menos de 24h, retornar cache
      if (existing) {
        const ageHours = (Date.now() - new Date(existing.generated_at).getTime()) / 1000 / 60 / 60
        if (ageHours < 24) {
          console.log('[generate-scenario] Using cache (age:', ageHours.toFixed(1), 'hours)')
          return new Response(
            JSON.stringify({
              success: true,
              cached: true,
              projections: [
                existing.projection_30,
                existing.projection_60,
                existing.projection_90,
              ],
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    console.log('[generate-scenario] Generating new projection...')

    // ============================================
    // 2. FETCH ALL DATA
    // ============================================

    // 2.1. Survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('survey_data')
      .eq('user_id', user_id)
      .maybeSingle()

    if (surveyError && surveyError.code !== 'PGRST116') {
      console.error('[generate-scenario] Survey error:', surveyError)
    }

    const survey = surveyData?.survey_data || {}

    // 2.2. Diagnostic IMPACT scores
    const { data: diagnostics, error: diagError } = await supabase
      .from('diagnostic_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('event_day', { ascending: true })

    if (diagError) {
      console.error('[generate-scenario] Diagnostic error:', diagError)
    }

    // 2.3. Chat messages (últimas 50 para insights)
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (chatError) {
      console.error('[generate-scenario] Chat error:', chatError)
    }

    // ============================================
    // 3. CALCULATE BOTTLENECK
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

    console.log('[generate-scenario] Gargalo:', gargalo)

    // ============================================
    // 4. EXTRACT CHAT INSIGHTS
    // ============================================

    let chatInsights = 'Nenhuma conversa com IA registrada.'

    if (chatMessages && chatMessages.length > 0) {
      const recentConversations = chatMessages
        .slice(0, 20)
        .reverse()
        .map(m => `${m.role === 'user' ? 'Participante' : 'IA'}: ${m.content}`)
        .join('\n')

      chatInsights = `Últimas conversas do participante com IA:\n${recentConversations}`
    }

    // ============================================
    // 5. BUILD MEGA-PROMPT
    // ============================================

    const prompt = `Você é um analista de negócios especializado em vendas B2B. Sua tarefa é criar uma projeção REALISTA do que acontece se o participante NÃO agir nos próximos 90 dias.

DADOS DO PARTICIPANTE:

**SURVEY (Calibragem inicial):**
- Modelo de negócio: ${survey?.modeloNegocio || 'Não informado'}
- Faturamento mensal: ${survey?.faturamento || 'Não informado'}
- Onde trava: ${survey?.ondeTrava || 'Não informado'}
- Problema principal que quer resolver: ${survey?.problemaPrincipal || 'Não informado'}
- Tentativas anteriores: ${survey?.tentativasAnteriores || 'Não informado'}
- Investimento prévio em formação: ${survey?.investimentoAnterior || 'Não informado'}

**DIAGNÓSTICO IMPACT (Scores 0-10):**
${diagnostics && diagnostics.length > 0 ? `
- Inspiração: ${diagnostics[diagnostics.length - 1]?.inspiracao || 0}/10
- Motivação: ${diagnostics[diagnostics.length - 1]?.motivacao || 0}/10
- Preparação: ${diagnostics[diagnostics.length - 1]?.preparacao || 0}/10
- Apresentação: ${diagnostics[diagnostics.length - 1]?.apresentacao || 0}/10
- Conversão: ${diagnostics[diagnostics.length - 1]?.conversao || 0}/10
- Transformação: ${diagnostics[diagnostics.length - 1]?.transformacao || 0}/10
` : '(Diagnóstico não preenchido)'}

🎯 **GARGALO IDENTIFICADO:** ${gargalo.etapa} (${gargalo.valor}/10)

**INSIGHTS DAS CONVERSAS COM IA:**
${chatInsights}

---

**SUA TAREFA:**

Crie 3 cenários progressivos de DEGRADAÇÃO (piora gradual) se ele NÃO agir.

Para cada cenário (30, 60, 90 dias), forneça:
1. **label** - Título curto e impactante (3-5 palavras)
2. **description** - 1-2 frases explicando o que acontece (específico ao negócio dele, não genérico)
3. **severity** - 'warning' para 30 dias, 'danger' para 60, 'critical' para 90
4. **financialImpact** - Perda estimada em R$ (número inteiro). Use o faturamento declarado para calcular. Se não tiver faturamento, use 0.

**REGRAS:**
- Seja ESPECÍFICO ao modelo de negócio dele (use termos do setor dele)
- Seja REALISTA mas impactante (não exagerado)
- Foque no gargalo: ${gargalo.etapa}
- Use dados do survey para personalizar (ex: se ele disse que trava em "fechamento", mencione isso)
- Mencione consequências tangíveis (perda de clientes, custo maior, tempo desperdiçado)
- Se tiver chat insights relevantes, use objeções/problemas revelados

**CÁLCULO FINANCEIRO (importante):**
- Se faturamento < 10k: perda conservadora (30 dias: 5-20%, 60 dias: 20-40%, 90 dias: 40-60%)
- Se faturamento 10-50k: perda moderada (30 dias: 10-25%, 60 dias: 25-45%, 90 dias: 45-65%)
- Se faturamento > 50k: perda significativa (30 dias: 15-30%, 60 dias: 30-50%, 90 dias: 50-70%)

**FORMATO DE SAÍDA:**

Retorne APENAS um JSON válido (sem markdown, sem explicações):

\`\`\`json
{
  "projection_30": {
    "days": 30,
    "label": "Título Impactante Curto",
    "description": "Descrição específica do que acontece em 30 dias se não agir.",
    "severity": "warning",
    "financialImpact": 5000
  },
  "projection_60": {
    "days": 60,
    "label": "Título Mais Grave",
    "description": "Descrição do agravamento em 60 dias.",
    "severity": "danger",
    "financialImpact": 15000
  },
  "projection_90": {
    "days": 90,
    "label": "Título Crítico",
    "description": "Descrição do colapso em 90 dias.",
    "severity": "critical",
    "financialImpact": 30000
  }
}
\`\`\`

NÃO adicione markdown, NÃO adicione explicações. APENAS o JSON.`

    // ============================================
    // 6. CALL OPENAI GPT-4o-mini
    // ============================================

    console.log('[generate-scenario] Calling OpenAI...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um analista de vendas B2B especializado em projeções de cenário.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('[generate-scenario] OpenAI error status:', openaiResponse.status)
      console.error('[generate-scenario] OpenAI error body:', errorText)

      // Parse error message if possible
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(`OpenAI error (${openaiResponse.status}): ${errorData.error?.message || errorText}`)
      } catch {
        throw new Error(`OpenAI error (${openaiResponse.status}): ${errorText}`)
      }
    }

    const openaiData = await openaiResponse.json()
    const rawContent = openaiData.choices[0].message.content
    const tokensUsed = openaiData.usage.total_tokens

    console.log('[generate-scenario] OpenAI response:', { tokensUsed })

    // Parse JSON response
    let scenarios
    try {
      scenarios = JSON.parse(rawContent)
    } catch (parseError) {
      console.error('[generate-scenario] JSON parse error:', parseError)
      console.error('[generate-scenario] Raw content:', rawContent)
      throw new Error('Failed to parse OpenAI JSON response')
    }

    // ============================================
    // 7. SAVE TO DATABASE
    // ============================================

    const { data: savedProjection, error: saveError } = await supabase
      .from('scenario_projections')
      .insert({
        user_id,
        projection_30: scenarios.projection_30,
        projection_60: scenarios.projection_60,
        projection_90: scenarios.projection_90,
        input_data: {
          survey: survey,
          diagnostics: diagnostics?.[diagnostics.length - 1] || null,
          gargalo,
          chat_message_count: chatMessages?.length || 0,
        },
        tokens_used: tokensUsed,
        version: 1, // Sempre versão 1 por enquanto
      })
      .select()
      .single()

    if (saveError) {
      console.error('[generate-scenario] Error saving projection:', saveError)
    } else {
      console.log('[generate-scenario] Projection saved successfully')
    }

    // ============================================
    // 8. RETURN PROJECTIONS
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        projections: [
          scenarios.projection_30,
          scenarios.projection_60,
          scenarios.projection_90,
        ],
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
    console.error('[generate-scenario] Error:', error)
    console.error('[generate-scenario] Error name:', error.name)
    console.error('[generate-scenario] Error stack:', error.stack)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        errorType: error.name,
      }),
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
