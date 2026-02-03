/**
 * ChatTest - Página de teste do chat IA
 * Para debugar erros de integração
 */

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export default function ChatTest() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (log: string) => {
    console.log(log)
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${log}`])
  }

  const testChat = async () => {
    if (!user) {
      setError('Usuário não autenticado')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setLogs([])

    try {
      addLog('Iniciando teste do chat...')
      addLog(`User ID: ${user.id}`)

      // Tentar criar uma conversa primeiro
      addLog('Criando conversa...')
      const { data: conv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          event_day: 1,
          module_id: 1,
        })
        .select('id')
        .single()

      if (convError) {
        addLog(`Erro ao criar conversa: ${convError.message}`)
        throw convError
      }

      addLog(`Conversa criada: ${conv.id}`)

      // Chamar Edge Function
      addLog('Chamando Edge Function chat-completion...')
      const requestBody = {
        user_id: user.id,
        conversation_id: conv.id,
        message: message || 'Olá, este é um teste',
        event_day: 1,
        module_id: 1,
      }

      addLog(`Request body: ${JSON.stringify(requestBody)}`)

      const { data, error: fnError } = await supabase.functions.invoke('chat-completion', {
        body: requestBody,
      })

      if (fnError) {
        addLog(`Erro da função: ${JSON.stringify(fnError)}`)
        throw fnError
      }

      addLog('Resposta recebida!')
      addLog(`Data: ${JSON.stringify(data)}`)

      setResponse(data)
    } catch (err: any) {
      console.error('Test error:', err)
      const errorMsg = err.message || err.toString()
      addLog(`ERRO: ${errorMsg}`)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Teste do Chat IA</h1>
        <p>Você precisa estar logado para testar.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Teste do Chat IA</h1>
      <p>User: {user.email}</p>

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Mensagem de teste:
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite uma mensagem (ou deixe vazio para usar 'Olá, este é um teste')"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        onClick={testChat}
        disabled={loading}
        style={{
          marginTop: '16px',
          padding: '12px 24px',
          background: loading ? '#ccc' : '#A855F7',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Testando...' : 'Testar Chat'}
      </button>

      {/* Logs */}
      {logs.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#1a1a1a',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <h3 style={{ color: '#fff', marginTop: 0 }}>Logs:</h3>
          {logs.map((log, i) => (
            <div key={i} style={{ color: '#22D3EE', marginBottom: '4px' }}>
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          color: '#991B1B',
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Erro:</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
        </div>
      )}

      {/* Response */}
      {response && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#D1FAE5',
          border: '1px solid #10B981',
          borderRadius: '8px',
          color: '#065F46',
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Sucesso!</h3>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
