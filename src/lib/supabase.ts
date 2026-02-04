import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (podem ser gerados automaticamente com Supabase CLI)
export type Profile = {
  id: string
  email: string
  name: string | null
  phone: string | null
  company: string | null
  role: string | null
  photo_url: string | null
  business_type: string | null
  is_admin: boolean
  xp: number
  completed_steps: string[]
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

export type SurveyResponse = {
  id: string
  user_id: string | null
  transaction_id: string | null
  email: string | null
  survey_data: Record<string, unknown>
  created_at: string
}

export type WhatsAppMessage = {
  id: string
  user_id: string | null
  transaction_id: string | null
  email: string | null
  survey_data: Record<string, unknown>
  prompt: string
  generated_message: string | null
  used_fallback: boolean
  status: string
  created_at: string
  sent_at: string | null
}

export type DiagnosticEntry = {
  id: string
  user_id: string
  event_day: 1 | 2
  block_number: number
  inspiracao: number | null
  motivacao: number | null
  preparacao: number | null
  apresentacao: number | null
  conversao: number | null
  transformacao: number | null
  created_at: string
  updated_at: string
}

export type EventState = {
  id: 1
  status: 'offline' | 'live' | 'paused' | 'activity' | 'lunch'
  current_day: 1 | 2
  current_module: number
  offer_released: boolean
  ai_enabled: boolean
  // Tab access control
  pre_evento_enabled: boolean
  pre_evento_unlock_date: string
  pre_evento_lock_date: string | null
  ao_vivo_enabled: boolean
  ao_vivo_unlock_date: string
  ao_vivo_lock_date: string | null
  pos_evento_enabled: boolean
  pos_evento_unlock_date: string
  pos_evento_lock_date: string | null
  // Other fields
  offer_visible: boolean
  lunch_active: boolean
  lunch_started_at: string | null
  lunch_duration_minutes: number | null
  updated_at: string
}

export type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'alert' | 'offer' | 'nps'
  action_label: string | null
  action_url: string | null
  is_active: boolean
  created_at: string
}

export type Purchase = {
  id: string
  user_id: string | null
  product_slug: string
  transaction_id: string | null
  price: number | null
  status: string
  purchased_at: string
}

export type XPLedgerEntry = {
  id: string
  user_id: string
  action: string
  xp_amount: number
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}
