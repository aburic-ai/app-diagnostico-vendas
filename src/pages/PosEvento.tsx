/**
 * Página Pós-Evento - Consolidação e Ação
 *
 * Fase onde o participante vê o resultado final do diagnóstico,
 * a projeção de consequências e o plano de ação de 7 dias.
 *
 * "Debriefing Militar" - Acabou a batalha, agora estamos na sala
 * de estratégia decidindo o próximo ataque.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Radio, Target, Shield } from 'lucide-react'

import {
  PageWrapper,
  BottomNav,
  SystemAlert,
  FinalReport,
  ScenarioProjection,
  ActionPlan,
  LockedOffer,
} from '../components/ui'
import type { IMPACTData, ActionItem } from '../components/ui'
import { theme } from '../styles/theme'

export function PosEvento() {
  const [activeNav, setActiveNav] = useState('posevento')
  const [showAlert, setShowAlert] = useState(true)

  // Dados do diagnóstico consolidado (viria do estado global/backend)
  const diagnosticData: IMPACTData = {
    inspiracao: 7,
    motivacao: 6,
    preparacao: 5,
    apresentacao: 4,
    conversao: 3,
    transformacao: 6,
  }

  // Calcular score (média * 10)
  const values = Object.values(diagnosticData)
  const average = values.reduce((a, b) => a + b, 0) / values.length
  const score = Math.round(average * 10)

  // Encontrar gargalo (menor valor)
  const entries = Object.entries(diagnosticData) as [keyof IMPACTData, number][]
  const sorted = entries.sort((a, b) => a[1] - b[1])
  const gargaloKey = sorted[0][0]
  const gargaloValue = sorted[0][1]

  const gargaloMap: Record<keyof IMPACTData, string> = {
    inspiracao: 'Inspiração',
    motivacao: 'Motivação',
    preparacao: 'Preparação',
    apresentacao: 'Apresentação',
    conversao: 'Conversão',
    transformacao: 'Transformação',
  }

  const gargalo = {
    etapa: gargaloMap[gargaloKey],
    letra: gargaloKey[0].toUpperCase(),
    valor: gargaloValue,
  }

  // Plano de ação de 7 dias
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: '1',
      day: 1,
      title: 'Revisar anotações do evento',
      description: 'Consolide os principais insights em 3 bullets.',
      completed: false,
    },
    {
      id: '2',
      day: 2,
      title: 'Reunião de alinhamento',
      description: 'Compartilhe o diagnóstico com sócios/equipe.',
      completed: false,
    },
    {
      id: '3',
      day: 3,
      title: 'Mapear gargalo principal',
      description: `Analise onde o "${gargalo.etapa}" trava no seu processo.`,
      completed: false,
    },
    {
      id: '4',
      day: 4,
      title: 'Listar 3 ações imediatas',
      description: 'Defina micro-correções que podem ser feitas esta semana.',
      completed: false,
    },
    {
      id: '5',
      day: 5,
      title: 'Implementar primeira correção',
      description: 'Execute a ação de menor esforço com maior impacto.',
      completed: false,
    },
    {
      id: '6',
      day: 6,
      title: 'Medir resultado inicial',
      description: 'Compare métricas antes vs depois da correção.',
      completed: false,
    },
    {
      id: '7',
      day: 7,
      title: 'Decidir próximo passo',
      description: 'Continuar sozinho ou ativar o Protocolo IMPACT?',
      completed: false,
    },
  ])

  // Dia atual (simulado - seria calculado pela data real)
  const currentDay = 1

  const handleToggleAction = (id: string) => {
    setActions(prev =>
      prev.map(action =>
        action.id === id ? { ...action, completed: !action.completed } : action
      )
    )
  }

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Liberado' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Liberado' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '180px',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ padding: '16px' }}
        >
          {/* ==================== HEADER STATUS ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              <Shield size={14} color={theme.colors.gold.DEFAULT} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.gold.DEFAULT,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                STATUS: FASE DE EXECUÇÃO
              </span>
            </div>

            <h1
              style={{
                fontFamily: theme.typography.fontFamily.body,
                fontSize: '11px',
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              DIAGNÓSTICO FINALIZADO
            </h1>
            <h2
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '20px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gold.DEFAULT,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                margin: '4px 0 0 0',
              }}
            >
              PROTOCOLO DE CORREÇÃO ATIVO
            </h2>
          </motion.div>

          {/* ==================== SYSTEM ALERT ==================== */}
          {showAlert && (
            <motion.div variants={itemVariants} style={{ marginBottom: '16px' }}>
              <SystemAlert
                type="offer"
                title="PROTOCOLO DE CORREÇÃO DISPONÍVEL"
                message={`Seu diagnóstico aponta falha crítica em ${gargalo.etapa}. Ative o protocolo presencial.`}
                actionLabel="ATIVAR"
                onAction={() => console.log('Ativar oferta')}
                onClose={() => setShowAlert(false)}
              />
            </motion.div>
          )}

          {/* ==================== FINAL REPORT ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <FinalReport
              data={diagnosticData}
              score={score}
              gargalo={gargalo}
              onDownload={() => console.log('Baixar PDF')}
            />
          </motion.div>

          {/* ==================== SCENARIO PROJECTION ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <ScenarioProjection gargalo={gargalo.etapa} />
          </motion.div>

          {/* ==================== UNLOCKED OFFER (PREMIUM) ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LockedOffer
              title="IMERSÃO PRESENCIAL IMPACT"
              subtitle="Protocolo de Correção em 3 Dias"
              isUnlocked={true}
              onClick={() => console.log('Reservar vaga')}
            />
          </motion.div>

          {/* ==================== ACTION PLAN ==================== */}
          <motion.div variants={itemVariants}>
            <ActionPlan
              actions={actions}
              currentDay={currentDay}
              onToggleAction={handleToggleAction}
            />
          </motion.div>

          {/* ==================== FOOTER MESSAGE ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(10, 12, 18, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              "O evento terminou. A transformação começa agora."
            </p>
            <p
              style={{
                fontSize: '10px',
                color: theme.colors.text.muted,
                margin: '8px 0 0 0',
              }}
            >
              Mantenha o app aberto pelos próximos 7 dias.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
