/**
 * Supabase Storage Service
 * Upload de áudios no bucket survey-audios
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BUCKET_NAME = 'survey-audios'

// Criar cliente Supabase com service_role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function uploadAudio(
  audioBuffer: Uint8Array,
  userId: string,
  email: string
): Promise<{
  success: boolean
  publicUrl?: string
  filePath?: string
  error?: string
}> {
  try {
    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const sanitizedEmail = email.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const fileName = `${userId}/${timestamp}-${sanitizedEmail}.ogg`

    console.log('[Storage] Fazendo upload do áudio...')
    console.log('[Storage] Bucket:', BUCKET_NAME)
    console.log('[Storage] File path:', fileName)
    console.log('[Storage] Size:', (audioBuffer.length / 1024).toFixed(2), 'KB')

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg', // Bucket só aceita audio/mpeg; conteúdo real é Opus, extensão é .ogg
        upsert: false, // Não sobrescrever (cada áudio é único)
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    console.log('[Storage] ✅ Upload concluído')
    console.log('[Storage] Public URL:', publicUrl)

    return {
      success: true,
      publicUrl,
      filePath: fileName,
    }
  } catch (error) {
    console.error('[Storage] Erro ao fazer upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deletar áudio (útil para cleanup ou testes)
 */
export async function deleteAudio(filePath: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    console.log('[Storage] Deletando áudio:', filePath)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error('[Storage] Delete error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('[Storage] ✅ Áudio deletado')
    return { success: true }
  } catch (error) {
    console.error('[Storage] Erro ao deletar:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verificar se bucket existe e está configurado
 */
export async function checkBucketHealth(): Promise<{
  exists: boolean
  error?: string
}> {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME)

    if (error) {
      console.error('[Storage] Bucket health check failed:', error)
      return {
        exists: false,
        error: error.message,
      }
    }

    console.log('[Storage] ✅ Bucket exists:', data.name)
    return { exists: true }
  } catch (error) {
    console.error('[Storage] Health check error:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
