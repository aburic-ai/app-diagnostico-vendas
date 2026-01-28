/**
 * Dados dos Módulos do Evento
 *
 * 17 módulos (0-16) divididos em 2 dias
 * Dia 1: Módulos 0-8
 * Dia 2: Módulos 9-16
 */

export interface EventModule {
  id: number
  title: string
  subtitle: string
  day: 1 | 2
}

export const EVENT_MODULES: EventModule[] = [
  // DIA 1
  { id: 0, title: 'INÍCIO DO DIAGNÓSTICO', subtitle: 'Entrando no modo "scanner" da sua venda', day: 1 },
  { id: 1, title: 'FRICÇÃO', subtitle: 'Por que o cliente trava antes de sumir', day: 1 },
  { id: 2, title: 'PERCEPÇÃO', subtitle: 'O significado muda o que o cliente "ouve"', day: 1 },
  { id: 3, title: 'ARQUITETURA DA DECISÃO', subtitle: 'A jornada invisível que vem antes da compra', day: 1 },
  { id: 4, title: 'MODELO 2D', subtitle: 'Etapas × profundidade, onde a venda quebra', day: 1 },
  { id: 5, title: 'IMPACT NA PRÁTICA', subtitle: 'Mapeando as 6 camadas no seu negócio', day: 1 },
  { id: 6, title: 'MENTE DO COMPRADOR', subtitle: 'O que ele conclui quando você acha que "foi"', day: 1 },
  { id: 7, title: 'SISTEMA', subtitle: 'Vendas previsíveis não nascem de tentativa', day: 1 },
  { id: 8, title: 'PREPARAÇÃO DIA 2', subtitle: 'Você já tem o mapa, amanhã vem o "por quê"', day: 1 },

  // DIA 2
  { id: 9, title: 'RETOMADA', subtitle: 'Impossível desver o gargalo depois do mapa', day: 2 },
  { id: 10, title: 'PROFUNDIDADE', subtitle: 'Os 5 critérios que definem se funciona', day: 2 },
  { id: 11, title: 'PATROCINADOR', subtitle: 'Condição especial para quem está no diagnóstico', day: 2 },
  { id: 12, title: 'ANTI-ALEATORIEDADE', subtitle: 'O verdadeiro inimigo das vendas previsíveis', day: 2 },
  { id: 13, title: 'PRÓXIMO PASSO', subtitle: 'Transformar diagnóstico em construção guiada', day: 2 },
  { id: 14, title: 'BLUEPRINT', subtitle: 'O que ajustar primeiro para destravar o resto', day: 2 },
  { id: 15, title: 'SIMULAÇÃO', subtitle: 'Sua jornada, pelo olhar real do cliente', day: 2 },
  { id: 16, title: 'SEUS PRÓXIMOS PASSOS', subtitle: 'Decisão consciente, não "depois eu vejo"', day: 2 },
]

export const TOTAL_MODULES = EVENT_MODULES.length

// Módulo onde a oferta IMPACT é liberada (Módulo 11 - Patrocinador)
export const OFFER_MODULE = 11

// Helpers
export function getModuleById(id: number): EventModule | undefined {
  return EVENT_MODULES.find(m => m.id === id)
}

export function getModulesByDay(day: 1 | 2): EventModule[] {
  return EVENT_MODULES.filter(m => m.day === day)
}

export function getCurrentDay(moduleId: number): 1 | 2 {
  const module = getModuleById(moduleId)
  return module?.day || 1
}
