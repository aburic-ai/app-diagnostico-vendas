/**
 * Generate Action Plan Edge Function
 *
 * Gera plano de ação personalizado de 7 dias
 * - Baseado em gargalo IMPACT + survey
 * - Foco no QUE fazer, NÃO no COMO
 * - Cache de 7 dias
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
  console.log('[generate-action-plan] Function invoked! Method:', req.method)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[generate-action-plan] CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('[generate-action-plan] Parsing request body...')
    const { user_id, force_regenerate } = await req.json()

    console.log('[generate-action-plan] Request:', { user_id, force_regenerate })

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
        .from('action_plans')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('[generate-action-plan] Error checking cache:', existingError)
      }

      // Se existe e foi gerado há menos de 7 dias, retornar cache
      if (existing) {
        const ageDays = (Date.now() - new Date(existing.generated_at).getTime()) / 1000 / 60 / 60 / 24
        if (ageDays < 7) {
          console.log('[generate-action-plan] Using cache (age:', ageDays.toFixed(1), 'days)')
          return new Response(
            JSON.stringify({
              success: true,
              cached: true,
              plan: {
                day_1: existing.day_1,
                day_2: existing.day_2,
                day_3: existing.day_3,
                day_4: existing.day_4,
                day_5: existing.day_5,
                day_6: existing.day_6,
                day_7: existing.day_7,
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    console.log('[generate-action-plan] Generating new plan...')

    // ============================================
    // 2. FETCH DATA
    // ============================================

    // 2.1. Survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('survey_data')
      .eq('user_id', user_id)
      .maybeSingle()

    if (surveyError && surveyError.code !== 'PGRST116') {
      console.error('[generate-action-plan] Survey error:', surveyError)
    }

    const survey = surveyData?.survey_data || {}

    // 2.2. Diagnostic IMPACT scores
    const { data: diagnostics, error: diagError } = await supabase
      .from('diagnostic_entries')
      .select('*')
      .eq('user_id', user_id)
      .order('event_day', { ascending: true })

    if (diagError) {
      console.error('[generate-action-plan] Diagnostic error:', diagError)
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

    console.log('[generate-action-plan] Gargalo:', gargalo)

    // ============================================
    // 4. BUILD MEGA-PROMPT
    // ============================================

    const prompt = `Você é um consultor especializado em vendas B2B.

DADOS DO PARTICIPANTE:
- Gargalo IMPACT: ${gargalo.etapa} (${gargalo.valor}/10)
- Modelo de negócio: ${survey?.modeloNegocio || 'Consultoria'}
- Onde trava: ${survey?.ondeTrava || 'Fechamento'}
- Problema principal: ${survey?.problemaPrincipal || 'Não informado'}

SUA TAREFA:
Crie um plano de ação de 7 dias focado em AÇÕES PRÁTICAS, NÃO em ensinar técnicas.

🚨 REGRA CRÍTICA - FOCO NO "QUE", NÃO NO "COMO":
✅ CORRETO: "Mapear onde ${gargalo.etapa} trava no seu processo"
✅ CORRETO: "Revisar anotações do evento"
✅ CORRETO: "Reunião de alinhamento com equipe"
✅ CORRETO: "Listar 3 micro-ações para implementar"

❌ ERRADO: "Use a técnica XYZ para resolver objeções"
❌ ERRADO: "Aplique o método ABC para prospecção"
❌ ERRADO: "Siga esses 5 passos para fechar vendas"

O COMO resolver é ensinado no evento presencial IMPACT.
Aqui você dá direção e foco, não entrega soluções completas.

ESTRUTURA OBRIGATÓRIA:
- DIA 1: Reflexão e consolidação (revisar anotações)
- DIA 2: Alinhamento com equipe/sócios
- DIA 3: Análise profunda do gargalo ${gargalo.etapa}
- DIA 4: Listar micro-ações corretivas
- DIA 5: Implementar primeira correção
- DIA 6: Medir resultado inicial
- DIA 7: Decisão (continuar sozinho ou IMPACT presencial)

PERSONALIZAÇÃO:
- Use o gargalo ${gargalo.etapa} no DIA 3
- Use modelo de negócio (${survey?.modeloNegocio || 'Consultoria'}) para contextualizar
- Seja específico mas sem dar o passo a passo de execução

FORMATO DE CADA TAREFA:
- Título: máximo 6 palavras, direto
- Descrição: máximo 12 palavras, acionável

FORMATO DE SAÍDA (JSON):
{
  "day_1": {
    "title": "Revisar anotações do evento",
    "description": "Consolide os principais insights em 3 bullets."
  },
  "day_2": {
    "title": "Reunião de alinhamento",
    "description": "Compartilhe o diagnóstico com sócios ou equipe."
  },
  "day_3": {
    "title": "Mapear gargalo de ${gargalo.etapa}",
    "description": "Analise onde ${gargalo.etapa} trava no seu processo de vendas."
  },
  "day_4": {
    "title": "Listar 3 ações imediatas",
    "description": "Defina micro-correções que podem ser feitas esta semana."
  },
  "day_5": {
    "title": "Implementar primeira correção",
    "description": "Execute a ação de menor esforço com maior impacto."
  },
  "day_6": {
    "title": "Medir resultado inicial",
    "description": "Compare métricas antes vs depois da correção aplicada."
  },
  "day_7": {
    "title": "Decidir próximo passo",
    "description": "Continuar sozinho ou ativar o Protocolo IMPACT presencial?"
  }
}

IMPORTANTE:
- Linguagem direta e acionável
- SEM jargões técnicos
- SEM metodologias detalhadas
- Foque em AÇÃO, não teoria

Retorne APENAS o JSON, sem markdown, sem explicações.`

    // ============================================
    // 5. CALL OPENAI GPT-4o-mini
    // ============================================

    console.log('[generate-action-plan] Calling OpenAI...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um consultor de vendas B2B especializado em planos de ação práticos.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('[generate-action-plan] OpenAI error status:', openaiResponse.status)
      console.error('[generate-action-plan] OpenAI error body:', errorText)

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

    console.log('[generate-action-plan] OpenAI response:', { tokensUsed })

    // Parse JSON response
    let plan
    try {
      plan = JSON.parse(rawContent)
    } catch (parseError) {
      console.error('[generate-action-plan] JSON parse error:', parseError)
      console.error('[generate-action-plan] Raw content:', rawContent)
      throw new Error('Failed to parse OpenAI JSON response')
    }

    // ============================================
    // 6. SAVE TO DATABASE
    // ============================================

    // Delete existing plan if any (UNIQUE constraint on user_id)
    await supabase
      .from('action_plans')
      .delete()
      .eq('user_id', user_id)

    const { data: savedPlan, error: saveError } = await supabase
      .from('action_plans')
      .insert({
        user_id,
        day_1: plan.day_1,
        day_2: plan.day_2,
        day_3: plan.day_3,
        day_4: plan.day_4,
        day_5: plan.day_5,
        day_6: plan.day_6,
        day_7: plan.day_7,
        input_data: {
          survey: survey,
          gargalo,
        },
        tokens_used: tokensUsed,
      })
      .select()
      .single()

    if (saveError) {
      console.error('[generate-action-plan] Error saving plan:', saveError)
    } else {
      console.log('[generate-action-plan] Plan saved successfully')
    }

    // ============================================
    // 7. RETURN PLAN
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        plan: {
          day_1: plan.day_1,
          day_2: plan.day_2,
          day_3: plan.day_3,
          day_4: plan.day_4,
          day_5: plan.day_5,
          day_6: plan.day_6,
          day_7: plan.day_7,
        },
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
    console.error('[generate-action-plan] Error:', error)
    console.error('[generate-action-plan] Error name:', error.name)
    console.error('[generate-action-plan] Error stack:', error.stack)

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
