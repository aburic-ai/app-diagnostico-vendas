/**
 * Página Ao Vivo - Durante o Evento
 *
 * Core da experiência: diagnóstico em tempo real, gráfico radar,
 * alertas de gargalo e oferta bloqueada.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import {
  PageWrapper,
  BottomNav,
  PageHeader,
  LiveTicker,
  RadarChart,
  DiagnosticSlider,
  GargaloAlert,
  LockedOffer,
} from '../components/ui'
import type { IMPACTData } from '../components/ui'
import { theme } from '../styles/theme'

// Blocos do evento
const BLOCOS = [
  { num: 1, title: 'A Jornada Psicológica', subtitle: 'Como o cliente pensa antes de comprar' },
  { num: 2, title: 'Inspiração', subtitle: 'O primeiro gatilho da venda' },
  { num: 3, title: 'Motivação', subtitle: 'Transformando interesse em desejo' },
  { num: 4, title: 'Preparação', subtitle: 'Construindo a decisão na mente' },
  { num: 5, title: 'Apresentação', subtitle: 'O momento da oferta' },
  { num: 6, title: 'Conversão', subtitle: 'Da decisão à ação' },
  { num: 7, title: 'Transformação', subtitle: 'Pós-venda e fidelização' },
]

export function AoVivo() {
  const [activeNav, setActiveNav] = useState('aovivo')
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1)
  const [showSliders, setShowSliders] = useState(true)
  const [currentBlock] = useState(3)

  // Dados do diagnóstico
  const [day1Data, setDay1Data] = useState<IMPACTData>({
    inspiracao: 7,
    motivacao: 6,
    preparacao: 5,
    apresentacao: 4,
    conversao: 3,
    transformacao: 6,
  })

  const [day2Data, setDay2Data] = useState<IMPACTData>({
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  })

  const currentData = selectedDay === 1 ? day1Data : day2Data
  const setCurrentData = selectedDay === 1 ? setDay1Data : setDay2Data

  // Encontrar gargalo (menor valor)
  const findGargalo = (data: IMPACTData) => {
    const entries = Object.entries(data) as [keyof IMPACTData, number][]
    const sorted = entries.sort((a, b) => a[1] - b[1])
    return sorted[0]
  }

  const gargalo = findGargalo(currentData)
  const gargaloMap: Record<keyof IMPACTData, { etapa: string; letra: string }> = {
    inspiracao: { etapa: 'Inspiração', letra: 'I' },
    motivacao: { etapa: 'Motivação', letra: 'M' },
    preparacao: { etapa: 'Preparação', letra: 'P' },
    apresentacao: { etapa: 'Apresentação', letra: 'A' },
    conversao: { etapa: 'Conversão', letra: 'C' },
    transformacao: { etapa: 'Transformação', letra: 'T' },
  }

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Liberado' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
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

  const updateDimension = (key: keyof IMPACTData, value: number) => {
    setCurrentData(prev => ({ ...prev, [key]: value }))
  }

  const currentBlockData = BLOCOS[currentBlock - 1]

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
          {/* ==================== HEADER ==================== */}
          <motion.div variants={itemVariants}>
            <PageHeader
              title="IMERSÃO ONLINE"
              subtitle="DIAGNÓSTICO DE VENDAS"
              marginBottom="16px"
            />
          </motion.div>

          {/* ==================== LIVE TICKER ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LiveTicker
              currentBlock={currentBlock}
              blockTitle={currentBlockData.title}
              blockSubtitle={currentBlockData.subtitle}
              totalBlocks={7}
              isLive={true}
            />
          </motion.div>

          {/* ==================== DAY SELECTOR ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {[1, 2].map((day) => (
              <motion.button
                key={day}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day as 1 | 2)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: selectedDay === day
                    ? day === 1
                      ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)'
                    : 'rgba(15, 17, 21, 0.6)',
                  border: `1px solid ${
                    selectedDay === day
                      ? day === 1
                        ? 'rgba(34, 211, 238, 0.5)'
                        : 'rgba(168, 85, 247, 0.5)'
                      : 'rgba(100, 116, 139, 0.2)'
                  }`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: selectedDay === day
                    ? day === 1
                      ? '0 0 20px rgba(34, 211, 238, 0.3)'
                      : '0 0 20px rgba(168, 85, 247, 0.3)'
                    : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: selectedDay === day
                      ? day === 1
                        ? theme.colors.accent.cyan.DEFAULT
                        : theme.colors.accent.purple.light
                      : theme.colors.text.muted,
                    letterSpacing: '0.1em',
                  }}
                >
                  DIA {day}
                </span>
                <p
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.secondary,
                    margin: '4px 0 0 0',
                  }}
                >
                  {day === 1 ? 'Etapas da Jornada' : 'Profundidade'}
                </p>
              </motion.button>
            ))}
          </motion.div>

          {/* ==================== RADAR CHART ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <RadarChart
              data1={day1Data}
              data2={day2Data.inspiracao > 0 ? day2Data : undefined}
              selectedDay={day2Data.inspiracao > 0 ? 'both' : 1}
              size={280}
            />
          </motion.div>

          {/* ==================== SLIDERS SECTION ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            {/* Toggle Header */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSliders(!showSliders)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: showSliders ? '12px 12px 0 0' : '12px',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                AJUSTAR DIAGNÓSTICO
              </span>
              {showSliders ? (
                <ChevronUp size={20} color={theme.colors.accent.cyan.DEFAULT} />
              ) : (
                <ChevronDown size={20} color={theme.colors.accent.cyan.DEFAULT} />
              )}
            </motion.button>

            {/* Sliders */}
            {showSliders && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: 'rgba(10, 12, 18, 0.5)',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <DiagnosticSlider
                  label="Inspiração"
                  letter="I"
                  description="O cliente sabe que tem um problema?"
                  value={currentData.inspiracao}
                  onChange={(v) => updateDimension('inspiracao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Motivação"
                  letter="M"
                  description="Ele quer resolver agora?"
                  value={currentData.motivacao}
                  onChange={(v) => updateDimension('motivacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Preparação"
                  letter="P"
                  description="Ele está pronto para comprar?"
                  value={currentData.preparacao}
                  onChange={(v) => updateDimension('preparacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Apresentação"
                  letter="A"
                  description="Sua oferta é clara?"
                  value={currentData.apresentacao}
                  onChange={(v) => updateDimension('apresentacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Conversão"
                  letter="C"
                  description="Ele consegue comprar sem fricção?"
                  value={currentData.conversao}
                  onChange={(v) => updateDimension('conversao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Transformação"
                  letter="T"
                  description="Ele vira um promotor?"
                  value={currentData.transformacao}
                  onChange={(v) => updateDimension('transformacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
              </motion.div>
            )}
          </motion.div>

          {/* ==================== GARGALO ALERT ==================== */}
          {gargalo[1] <= 5 && (
            <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
              <GargaloAlert
                etapa={gargaloMap[gargalo[0]].etapa}
                letra={gargaloMap[gargalo[0]].letra}
                valor={gargalo[1]}
                impacto="Clientes abandonam antes de fechar porque não percebem urgência ou valor."
                consequencia="Perda estimada de 30-40% das vendas potenciais no próximo trimestre."
                expanded={true}
              />
            </motion.div>
          )}

          {/* ==================== ACTION BUTTONS ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Workbook Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(34, 211, 238, 0.2)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} color={theme.colors.accent.cyan.DEFAULT} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.cyan.DEFAULT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Workbook
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.text.secondary,
                }}
              >
                Exercícios do bloco
              </span>
            </motion.button>

            {/* IA Simulator Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Brain size={22} color={theme.colors.accent.purple.light} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.purple.light,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Simulador IA
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.text.secondary,
                }}
              >
                Testar hipóteses
              </span>
            </motion.button>
          </motion.div>

          {/* ==================== LOCKED OFFER ==================== */}
          <motion.div variants={itemVariants}>
            <LockedOffer
              title="PROTOCOLO IMPACT"
              subtitle="Imersão Presencial de 3 Dias"
              isUnlocked={false}
              unlockTime="16:30"
              lockedMessage="Essa etapa exige algo que não acontece sozinho."
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
