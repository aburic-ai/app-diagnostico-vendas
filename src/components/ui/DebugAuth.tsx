import { useAuth } from '../../hooks/useAuth'

export function DebugAuth() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.9)', color: '#0f0', padding: '10px', zIndex: 9999, fontSize: '12px', fontFamily: 'monospace' }}>Loading...</div>

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      borderRight: '2px solid #0f0',
      borderBottom: '2px solid #0f0'
    }}>
      <div><strong>🔐 AUTH DEBUG</strong></div>
      <div>User: {user?.email || 'null'}</div>
      <div>Profile Name: {profile?.name || 'null'}</div>
      <div>Profile Email: {profile?.email || 'null'}</div>
      <div>Is Admin: {profile?.is_admin ? 'YES' : 'NO'}</div>
      <div>XP: {profile?.xp || 0}</div>
    </div>
  )
}
