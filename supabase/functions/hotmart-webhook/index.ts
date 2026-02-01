/**
 * Hotmart Webhook - Edge Function
 *
 * Processa notificações de compra e reembolso da Hotmart
 *
 * Eventos processados:
 * - PURCHASE_COMPLETE → Registra compra + dá XP ao usuário
 * - PURCHASE_REFUNDED → Reverte XP + marca status como refunded
 * - PURCHASE_CANCELED → Mesmo comportamento que refunded
 *
 * Deploy: supabase functions deploy hotmart-webhook
 * Logs: supabase functions logs hotmart-webhook
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuração
const HOTMART_SECRET = Deno.env.get('HOTMART_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hotmart-hottok',
}

// Mapeamento: Produto → Dados
const PRODUCT_MAP = {
  // TESTE HOTMART - REMOVER DEPOIS DE VALIDAR
  test_hotmart: {
    slug: 'test-hotmart',
    xp: 0,  // Teste, não dá XP
    stepId: 'test-purchase',
    keywords: ['produto test', 'postback'],
  },
  // Imersão IMPACT (presencial) - VERIFICAR PRIMEIRO (keywords mais específicas)
  impact: {
    slug: 'impact-presencial',
    xp: 300,
    stepId: 'impact-enrollment',
    keywords: ['impact', 'presencial'],
  },
  // Imersão Diagnóstico de Vendas (online) - Produto principal, dá acesso ao app
  imersao_diagnostico: {
    slug: 'imersao-diagnostico-vendas',
    xp: 0,  // NÃO dá XP, só acesso ao app
    stepId: 'event-access',  // Marca que tem acesso ao evento
    keywords: ['imersão', 'imersao', 'diagnóstico', 'diagnostico', 'vendas'],
  },
  // TODO: Adicionar quando produtos forem criados na Hotmart:
  // pdf: { slug: 'diagnostico-pdf', xp: 40, stepId: 'purchase-pdf-diagnosis', keywords: [...] },
  // aulas: { slug: 'aulas-editadas', xp: 40, stepId: 'purchase-edited-lessons', keywords: [...] },
}

/**
 * Validar signature do webhook Hotmart
 * Documentação: https://developers.hotmart.com/docs/pt-BR/v1/webhooks/overview/
 */
function validateSignature(signature: string | null, body: string): boolean {
  // TODO: Implementar validação HMAC-SHA256 conforme doc Hotmart
  // Por enquanto, aceitar se o header existe
  if (!signature || !HOTMART_SECRET) {
    console.warn('⚠️ Webhook signature validation disabled (missing secret)')
    return true
  }

  // Validação placeholder - SUBSTITUIR por HMAC real
  return signature === HOTMART_SECRET || signature.length > 10
}

/**
 * Detectar produto a partir do nome
 */
function detectProduct(productName: string): typeof PRODUCT_MAP[keyof typeof PRODUCT_MAP] | null {
  const nameLower = productName.toLowerCase()

  // Verificar todos os produtos mapeados
  for (const [key, config] of Object.entries(PRODUCT_MAP)) {
    if (config.keywords.some(kw => nameLower.includes(kw))) {
      return config
    }
  }

  return null
}

/**
 * Processar evento PURCHASE_COMPLETE
 */
async function handlePurchaseComplete(supabase: any, data: any) {
  const { buyer, product, purchase } = data
  const email = buyer.email.toLowerCase().trim()
  const transactionId = purchase.transaction  // Transaction ID está dentro de purchase
  const buyerName = buyer.name || `${buyer.first_name} ${buyer.last_name}`.trim()
  const cpfCnpj = buyer.document  // CPF/CNPJ sem pontos (já vem limpo da Hotmart)

  console.log(`📦 Processing purchase: ${email} | ${product.name}`)

  // 1. Detectar produto
  const productInfo = detectProduct(product.name)

  if (!productInfo) {
    console.warn(`⚠️ Product not mapped: ${product.name}`)
    return { success: false, error: 'Product not mapped' }
  }

  console.log(`✓ Product detected: ${productInfo.slug} (+${productInfo.xp} XP)`)

  // 2. Verificar idempotência (compra já processada?)
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('transaction_id', transactionId)
    .single()

  if (existingPurchase) {
    console.log(`⚠️ Purchase already processed: ${transactionId}`)
    return { success: true, duplicate: true }
  }

  // 3. Encontrar ou criar usuário
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (!profile) {
    console.log(`👤 Creating new user: ${email}`)

    // Criar usuário via auth.admin com senha padrão = CPF/CNPJ
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: cpfCnpj,  // Senha padrão = CPF/CNPJ (sem pontos)
      email_confirm: true, // Auto-confirmar email
    })

    if (authError) {
      console.error(`❌ Error creating auth user: ${authError.message}`)
      throw new Error(`Failed to create user: ${authError.message}`)
    }

    // Aguardar trigger criar profile (pode demorar alguns ms)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Buscar profile criado
    const { data: newProfile, error: newProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (newProfileError || !newProfile) {
      console.error(`❌ Profile not created: ${newProfileError?.message}`)
      throw new Error('Profile creation failed')
    }

    profile = newProfile
  }

  // 4. Atualizar nome no perfil (sempre atualizar com dados da Hotmart)
  if (buyerName) {
    await supabase
      .from('profiles')
      .update({ name: buyerName })
      .eq('id', profile.id)

    console.log(`✓ Profile updated: ${buyerName}`)
  }

  // 5. Inserir registro de compra
  // Montar telefone completo: DDI + telefone (ex: "55 11999999999")
  const buyerPhone = buyer.checkout_phone
    ? `${buyer.checkout_phone_code || ''} ${buyer.checkout_phone}`.trim()
    : null

  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: profile.id,
      product_slug: productInfo.slug,
      transaction_id: transactionId,
      price: purchase.price?.value || null,
      full_price: purchase.full_price?.value || null,
      buyer_name: buyerName,
      buyer_document: cpfCnpj,
      buyer_phone: buyerPhone,
      status: 'approved',
      purchased_at: purchase.approved_date
        ? new Date(purchase.approved_date)
        : new Date(),
    })

  if (purchaseError) {
    console.error(`❌ Error inserting purchase: ${purchaseError.message}`)
    throw new Error(`Purchase insert failed: ${purchaseError.message}`)
  }

  console.log(`✓ Purchase recorded: ${transactionId}`)

  // 6. Dar XP ao usuário (marcar step como completo)
  const currentSteps = profile.completed_steps || []

  // Evitar duplicação de XP
  if (currentSteps.includes(productInfo.stepId)) {
    console.log(`⚠️ Step already completed: ${productInfo.stepId}`)
    return { success: true, duplicate_xp: true }
  }

  const newSteps = [...currentSteps, productInfo.stepId]
  const newXP = (profile.xp || 0) + productInfo.xp

  const { error: xpError } = await supabase
    .from('profiles')
    .update({
      completed_steps: newSteps,
      xp: newXP,
    })
    .eq('id', profile.id)

  if (xpError) {
    console.error(`❌ Error updating XP: ${xpError.message}`)
    throw new Error(`XP update failed: ${xpError.message}`)
  }

  console.log(`✅ Purchase complete! ${email} | ${productInfo.slug} | +${productInfo.xp} XP | Total: ${newXP} XP`)

  return {
    success: true,
    user_id: profile.id,
    product: productInfo.slug,
    xp_awarded: productInfo.xp,
    total_xp: newXP,
  }
}

/**
 * Processar evento PURCHASE_REFUNDED / PURCHASE_CANCELED
 */
async function handlePurchaseRefund(supabase: any, data: any) {
  const { transaction } = data

  console.log(`💸 Processing refund: ${transaction}`)

  // 1. Encontrar compra
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select(`
      *,
      profiles!inner(*)
    `)
    .eq('transaction_id', transaction)
    .single()

  if (purchaseError || !purchase) {
    console.warn(`⚠️ Purchase not found: ${transaction}`)
    return { success: false, error: 'Purchase not found' }
  }

  console.log(`✓ Purchase found: ${purchase.product_slug}`)

  // 2. Atualizar status da compra
  const { error: updateError } = await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      refunded_at: new Date(),
    })
    .eq('id', purchase.id)

  if (updateError) {
    console.error(`❌ Error updating purchase: ${updateError.message}`)
    throw new Error(`Purchase update failed: ${updateError.message}`)
  }

  console.log(`✓ Purchase marked as refunded`)

  // 3. Detectar produto para reverter XP
  const productConfig = Object.values(PRODUCT_MAP).find(
    p => p.slug === purchase.product_slug
  )

  if (!productConfig) {
    console.warn(`⚠️ Product config not found: ${purchase.product_slug}`)
    return { success: true, xp_reverted: false }
  }

  // 4. Reverter XP (remover step e subtrair XP)
  const profile = purchase.profiles
  const newSteps = (profile.completed_steps || []).filter(
    (s: string) => s !== productConfig.stepId
  )
  const newXP = Math.max(0, (profile.xp || 0) - productConfig.xp)

  const { error: xpError } = await supabase
    .from('profiles')
    .update({
      completed_steps: newSteps,
      xp: newXP,
    })
    .eq('id', profile.id)

  if (xpError) {
    console.error(`❌ Error reverting XP: ${xpError.message}`)
    throw new Error(`XP revert failed: ${xpError.message}`)
  }

  console.log(`✅ Refund complete! ${profile.email} | ${purchase.product_slug} | -${productConfig.xp} XP | Total: ${newXP} XP`)

  return {
    success: true,
    user_id: profile.id,
    product: purchase.product_slug,
    xp_reverted: productConfig.xp,
    total_xp: newXP,
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Validar signature
    const signature = req.headers.get('X-Hotmart-Hottok')
    const body = await req.text()

    if (!validateSignature(signature, body)) {
      console.error('❌ Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Parsear payload
    const payload = JSON.parse(body)
    const { event, data } = payload

    console.log(`📨 Webhook received: ${event}`)

    // 3. Criar cliente Supabase (service_role para bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 4. Processar evento
    let result

    // PURCHASE_APPROVED = evento da Hotmart para compra aprovada
    // PURCHASE_COMPLETE = evento alternativo (manter para compatibilidade)
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
      result = await handlePurchaseComplete(supabase, data)
    }
    // PURCHASE_PROTEST = pedido de reembolso/chargeback (Hotmart)
    // PURCHASE_REFUNDED = reembolso aprovado (manter para compatibilidade)
    // PURCHASE_CANCELED = cancelamento (manter para compatibilidade)
    else if (event === 'PURCHASE_PROTEST' || event === 'PURCHASE_REFUNDED' || event === 'PURCHASE_CANCELED') {
      result = await handlePurchaseRefund(supabase, data)
    } else {
      console.log(`ℹ️ Event not handled: ${event}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Event not handled' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 5. Retornar sucesso
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error: any) {
    console.error('❌ Webhook error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
