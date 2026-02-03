/**
 * ProfileModal - Modal de perfil reutilizável
 * Usado em todas as páginas do app
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Zap, Upload, Check } from 'lucide-react'
import { theme } from '../../styles/theme'
import { useAuth } from '../../hooks/useAuth'
import { XP_CONFIG } from '../../config/xp-system'
import { supabase } from '../../lib/supabase'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [uploading, setUploading] = useState(false)

  if (!profile) return null

  // Calcular progresso do perfil (mesma lógica do PreEvento)
  const profileFields = [
    profile.name,
    profile.email,
    profile.phone,
    profile.company,
    profile.role,
    profile.photo_url,
  ]
  const completedFields = profileFields.filter(f => f && String(f).trim() !== '').length
  const profileProgress = Math.round((completedFields / profileFields.length) * 100)

  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.')
      return
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 2MB.')
      return
    }

    setUploading(true)

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Obter URL pública
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path)

      // Atualizar perfil no Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: publicData.publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Recarregar página para atualizar o perfil
      window.location.reload()
    } catch (error: any) {
      console.error('Error uploading photo:', error)

      // Mostrar mensagem de erro específica
      let errorMessage = 'Erro ao fazer upload da foto.'

      if (error?.message) {
        // Mensagens específicas baseadas no erro
        if (error.message.includes('permission') || error.message.includes('Policy')) {
          errorMessage = 'Você não tem permissão para fazer upload de fotos. Contate o administrador.'
        } else if (error.message.includes('storage')) {
          errorMessage = 'Erro no servidor de armazenamento. Tente novamente em alguns minutos.'
        } else if (error.message.includes('size') || error.message.includes('large')) {
          errorMessage = 'Arquivo muito grande. Máximo 2MB.'
        } else {
          errorMessage = `Erro: ${error.message}`
        }
      }

      alert(errorMessage + '\n\nSe o problema persistir, contate o suporte.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Atualizar perfil no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ name, phone })
        .eq('id', profile.id)

      if (error) throw error

      // Recarregar para atualizar o perfil
      window.location.reload()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erro ao salvar perfil. Tente novamente.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              maxHeight: '85vh',
              background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} color={theme.colors.accent.purple.light} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.accent.purple.light,
                      margin: 0,
                    }}
                  >
                    MEU PERFIL
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Zap size={12} color={theme.colors.gold.DEFAULT} />
                    <span style={{ fontSize: '10px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
                      +{XP_CONFIG.PRE_EVENT.COMPLETE_PROFILE} XP ao completar
                    </span>
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color={theme.colors.text.muted} />
              </motion.button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
              }}
            >
              {/* Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                    Progresso do perfil
                  </span>
                  <span style={{ fontSize: '11px', color: theme.colors.accent.purple.light, fontWeight: 'bold' }}>
                    {profileProgress}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(30, 35, 45, 0.8)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileProgress}%` }}
                    style={{
                      height: '100%',
                      background: profileProgress === 100
                        ? theme.colors.accent.cyan.DEFAULT
                        : `linear-gradient(90deg, ${theme.colors.accent.purple.DEFAULT} 0%, ${theme.colors.accent.purple.light} 100%)`,
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePhotoUpload}
                  disabled={uploading}
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: profile.photo_url
                      ? `url(${profile.photo_url}) center/cover`
                      : 'rgba(168, 85, 247, 0.15)',
                    border: `3px solid ${profile.photo_url ? theme.colors.accent.cyan.DEFAULT : 'rgba(168, 85, 247, 0.4)'}`,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {!profile.photo_url && !uploading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <Upload size={24} color={theme.colors.accent.purple.light} />
                      <span style={{ fontSize: '8px', color: theme.colors.text.muted }}>Foto</span>
                    </div>
                  )}
                  {uploading && <span style={{ fontSize: '10px', color: '#fff' }}>...</span>}
                  {profile.photo_url && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '50%',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                    >
                      <Upload size={20} color="#fff" />
                    </div>
                  )}
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = theme.colors.accent.purple.light)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(100, 116, 139, 0.3)')}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = theme.colors.accent.purple.light)}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(100, 116, 139, 0.3)')}
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(10, 12, 18, 0.5)',
                      border: '1px solid rgba(100, 116, 139, 0.2)',
                      borderRadius: '8px',
                      color: theme.colors.text.secondary,
                      fontSize: '14px',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer - Save Button */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(100, 116, 139, 0.2)' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: `linear-gradient(90deg, ${theme.colors.accent.purple.DEFAULT} 0%, ${theme.colors.accent.purple.light} 100%)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={18} />
                SALVAR PERFIL
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
