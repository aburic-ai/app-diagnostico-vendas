/**
 * GHL Lookup Contact - Edge Function
 *
 * Busca o contact_id de um contato no GoHighLevel pelo email
 * Usado para vincular contatos do GHL com usuários do Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GHL_API_KEY = Deno.env.get('GHL_API_KEY')!
const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[ghl-lookup-contact] Buscando contato para:', email)

    // Buscar contato no GHL pela API
    const searchUrl = `https://services.leadconnectorhq.com/contacts/search`

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        query: email,
        limit: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[ghl-lookup-contact] Erro na API GHL:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to search GHL', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    console.log('[ghl-lookup-contact] Resposta GHL:', JSON.stringify(data))

    // Extrair contact_id
    const contact = data.contacts?.[0]

    if (!contact) {
      console.log('[ghl-lookup-contact] Contato não encontrado para:', email)
      return new Response(
        JSON.stringify({ contact_id: null, message: 'Contact not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[ghl-lookup-contact] ✅ Contato encontrado:', contact.id)

    return new Response(
      JSON.stringify({
        contact_id: contact.id,
        name: contact.name || contact.firstName,
        email: contact.email,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[ghl-lookup-contact] Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
