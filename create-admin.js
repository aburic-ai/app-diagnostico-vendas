// Script para criar usuário ADMIN de teste
// Execute: node create-admin.js

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar .env.local
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const adminEmail = 'andre.buric@gmail.com'
  const adminPassword = 'aburic4478$'

  console.log('🔄 Criando usuário admin...')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Senha: ${adminPassword}`)

  // 1. Criar usuário no Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      emailRedirectTo: `${supabaseUrl}/auth/v1/verify`,
    },
  })

  if (signUpError) {
    console.error('❌ Erro ao criar usuário:', signUpError.message)

    // Se o usuário já existe, tentar fazer login
    if (signUpError.message.includes('already registered')) {
      console.log('⚠️  Usuário já existe. Tentando fazer login...')

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      })

      if (signInError) {
        console.error('❌ Erro ao fazer login:', signInError.message)
        process.exit(1)
      }

      console.log('✅ Login realizado com sucesso!')
      console.log(`   User ID: ${signInData.user.id}`)

      // Atualizar perfil para admin
      await updateProfileToAdmin(signInData.user.id, adminEmail)
      return
    }

    process.exit(1)
  }

  if (!signUpData.user) {
    console.error('❌ Erro: Usuário não foi criado')
    process.exit(1)
  }

  console.log('✅ Usuário criado com sucesso!')
  console.log(`   User ID: ${signUpData.user.id}`)

  // Aguardar um pouco para o trigger criar o perfil
  console.log('⏳ Aguardando criação do perfil (3 segundos)...')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // 2. Atualizar perfil para admin
  await updateProfileToAdmin(signUpData.user.id, adminEmail)
}

async function updateProfileToAdmin(userId, email) {
  console.log('🔄 Atualizando perfil para admin...')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      is_admin: true,
      name: 'Admin Teste',
    })
    .eq('id', userId)
    .select()

  if (error) {
    console.error('❌ Erro ao atualizar perfil:', error.message)
    console.log('\n⚠️  Execute este SQL manualmente no Supabase Dashboard:')
    console.log(`\nUPDATE profiles SET is_admin = true, name = 'Andre Buric' WHERE email = '${email}';\n`)
    process.exit(1)
  }

  console.log('✅ Perfil atualizado para admin!')
  console.log('\n========================================')
  console.log('🎉 ADMIN CRIADO COM SUCESSO!')
  console.log('========================================')
  console.log(`Email: ${email}`)
  console.log(`Senha: Admin123!`)
  console.log('\nAcesse: http://localhost:5173/login')
  console.log('========================================\n')
}

createAdmin().catch(console.error)
