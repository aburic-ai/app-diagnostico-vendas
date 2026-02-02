# 🔐 Sistema de Autenticação

Documentação completa do sistema de autenticação da aplicação Diagnóstico de Vendas.

---

## 📋 Índice

1. [Métodos de Autenticação](#métodos-de-autenticação)
2. [Configuração Supabase](#configuração-supabase)
3. [Fluxos de Autenticação](#fluxos-de-autenticação)
4. [Reset de Senha](#reset-de-senha)
5. [Magic Link (Link Mágico)](#magic-link-link-mágico)
6. [Proteção de Rotas](#proteção-de-rotas)

---

## 🔑 Métodos de Autenticação

A aplicação suporta **dois métodos** de autenticação:

### 1. Email + Senha (Padrão)
- Método principal e recomendado
- Usuário digita email e senha
- Autenticação via `supabase.auth.signInWithPassword()`

### 2. Magic Link (Alternativa)
- Método alternativo para casos de erro
- **Só aparece após falha no login com senha**
- Envia link de acesso único por email
- Autenticação via `supabase.auth.signInWithOtp()`

---

## ⚙️ Configuração Supabase

### URL Configuration (OBRIGATÓRIO)

Acesse: `Authentication → URL Configuration`

**Site URL:**
```
https://neuro-app.brainpower.com.br
```

**Redirect URLs:** (adicione TODAS)
```
https://neuro-app.brainpower.com.br/**
https://neuro-app.brainpower.com.br/pre-evento
https://neuro-app.brainpower.com.br/reset-password
http://localhost:5173/**
http://localhost:3000/**
```

### Email Templates

#### Reset Password Email
- **Subject:** `Resetar senha - Diagnóstico de Vendas`
- **Redirect URL:** `https://neuro-app.brainpower.com.br/reset-password`
- Template padrão do Supabase (modificado)

#### Magic Link Email
- **Subject:** `Seu link de acesso - Diagnóstico de Vendas`
- **Redirect URL:** `https://neuro-app.brainpower.com.br/pre-evento`
- Template padrão do Supabase

---

## 🔄 Fluxos de Autenticação

### Fluxo 1: Login com Senha (Padrão)

```
┌─────────────────┐
│  Usuário        │
│  /login         │
└────────┬────────┘
         │
         │ 1. Digite email + senha
         │ 2. Clica em "ACESSAR COCKPIT"
         ▼
┌─────────────────┐
│  Login.tsx      │
│  handleSubmit() │
└────────┬────────┘
         │
         │ 3. signIn(email, password)
         ▼
┌─────────────────┐
│  AuthContext    │
│  signIn()       │
└────────┬────────┘
         │
         │ 4. supabase.auth.signInWithPassword()
         ▼
┌─────────────────┐
│  Supabase Auth  │
└────────┬────────┘
         │
         ├─── ✅ Sucesso ──────────────────┐
         │                                  │
         │ 5. Session criada                │
         │ 6. Profile carregado             │
         │ 7. Redireciona /pre-evento       │
         │                                  │
         └─── ❌ Erro ─────────────────────┤
                                            │
         8. Mostra mensagem de erro         │
         9. Exibe botão "RECEBER LINK       │
            DE ACESSO VIA EMAIL"           │
                                            ▼
                                ┌─────────────────┐
                                │  Magic Link     │
                                │  (Alternativa)  │
                                └─────────────────┘
```

### Fluxo 2: Magic Link (Após Erro)

```
┌─────────────────┐
│  Usuário        │
│  Erro de login  │
└────────┬────────┘
         │
         │ 1. Vê botão "RECEBER LINK DE ACESSO VIA EMAIL"
         │ 2. Clica no botão
         ▼
┌─────────────────┐
│  Login.tsx      │
│  handleMagicLink│
└────────┬────────┘
         │
         │ 3. supabase.auth.signInWithOtp()
         ▼
┌─────────────────┐
│  Supabase Auth  │
└────────┬────────┘
         │
         │ 4. Envia email com link único
         ▼
┌─────────────────┐
│  Email Inbox    │
└────────┬────────┘
         │
         │ 5. Usuário clica no link
         ▼
┌─────────────────┐
│  /pre-evento    │
│  Auto-login     │
└─────────────────┘
```

---

## 🔓 Reset de Senha

### Como Funciona

1. **Admin inicia reset** via Supabase Dashboard:
   - `Authentication → Users → ... → Reset Password`

2. **Usuário recebe email** com link:
   ```
   https://neuro-app.brainpower.com.br/reset-password#access_token=...&type=recovery
   ```

3. **Página `/reset-password` detecta o token** na URL:
   ```typescript
   const hashParams = new URLSearchParams(window.location.hash.substring(1))
   const type = hashParams.get('type')

   if (type !== 'recovery') {
     navigate('/login')
   }
   ```

4. **Usuário cria nova senha**:
   ```typescript
   await supabase.auth.updateUser({ password: novaSenha })
   ```

5. **Redireciona automaticamente** para `/pre-evento`

### Arquivos Envolvidos

- **Página:** `src/pages/ResetPassword.tsx`
- **Rota:** `/reset-password` (público, sem autenticação)
- **Context:** `src/context/AuthContext.tsx`

### Validações

- Senha mínima: **8 caracteres**
- Confirmação de senha obrigatória
- Token de recovery válido (detectado na URL)

---

## ✨ Magic Link (Link Mágico)

### Quando Usar

O botão de **Magic Link** só aparece em **UMA situação**:

1. Usuário tenta fazer login com senha
2. Login **falha** (senha errada, email incorreto, etc.)
3. Sistema mostra botão alternativo

### Por Que Esse Design?

**Evita confusão:**
- Se mostrar logo de cara, usuário acha que pode entrar "de qualquer jeito"
- Ao aparecer só após erro, fica claro que é uma **alternativa** de recuperação

### UX Flow

```
LOGIN INICIAL
┌─────────────────────────────┐
│ Email: _________________    │
│ Senha: _________________    │
│                             │
│ [ACESSAR COCKPIT]           │
└─────────────────────────────┘

        ↓ (usuário erra senha)

APÓS ERRO
┌─────────────────────────────┐
│ ❌ Email ou senha incorretos│
│                             │
│ Email: andre@exemplo.com    │
│ Senha: _________________    │
│                             │
│ [ACESSAR COCKPIT]           │
│                             │
│ [📧 RECEBER LINK DE         │
│     ACESSO VIA EMAIL]       │ ← SÓ APARECE AQUI
└─────────────────────────────┘
```

### Implementação

**State que controla visibilidade:**
```typescript
const [showMagicLinkOption, setShowMagicLinkOption] = useState(false)
```

**Ativado em caso de erro:**
```typescript
if (signInError) {
  setError(friendlyMessage)
  setShowMagicLinkOption(true) // ← Mostra o botão
  setLoading(false)
}
```

**Renderização condicional:**
```typescript
{showMagicLinkOption && (
  <button onClick={handleMagicLink}>
    RECEBER LINK DE ACESSO VIA EMAIL
  </button>
)}
```

---

## 🛡️ Proteção de Rotas

### Rotas Públicas (Sem Autenticação)

- `/` → Redireciona para `/login`
- `/login`
- `/reset-password`
- `/obrigado` (Thank You page pós-compra Hotmart)
- `/demo`
- `/sandbox`

### Rotas Protegidas (Requer Autenticação)

- `/pre-evento` ✓
- `/ao-vivo` ✓
- `/pos-evento` ✓

### Rotas Admin (Requer `is_admin = true`)

- `/admin` ✓

### Componente ProtectedRoute

**Arquivo:** `src/components/ui/ProtectedRoute.tsx`

```typescript
interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Loading
  if (loading) {
    return <LoadingScreen />
  }

  // Não autenticado
  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  // Requer admin mas não é admin
  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/pre-evento" replace />
  }

  return <>{children}</>
}
```

### Uso no App.tsx

```typescript
// Rota protegida normal
<Route path="/pre-evento" element={
  <ProtectedRoute>
    <PreEvento />
  </ProtectedRoute>
} />

// Rota protegida admin
<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <Admin />
  </ProtectedRoute>
} />
```

---

## 🗂️ Estrutura de Arquivos

```
src/
├── pages/
│   ├── Login.tsx               ← Página de login (email/senha + magic link)
│   └── ResetPassword.tsx       ← Página de criar nova senha
│
├── context/
│   └── AuthContext.tsx         ← Context global de autenticação
│
├── hooks/
│   └── useAuth.ts              ← Hook para acessar auth context
│
├── components/ui/
│   └── ProtectedRoute.tsx      ← Proteção de rotas
│
└── lib/
    └── supabase.ts             ← Cliente Supabase configurado
```

---

## 🔐 Security Checklist

- [x] Senhas nunca expostas no client-side
- [x] Tokens JWT armazenados em `localStorage` pelo Supabase SDK
- [x] Row Level Security (RLS) ativo no banco
- [x] Reset de senha só via email verificado
- [x] Magic links expiram após uso
- [x] Rotas admin protegidas por `is_admin` flag
- [x] HTTPS obrigatório em produção
- [x] Redirect URLs whitelistados no Supabase

---

## 🧪 Testes Manuais

### Teste 1: Login com Senha
1. Acesse https://neuro-app.brainpower.com.br/
2. Digite email cadastrado
3. Digite senha correta
4. Clique em "ACESSAR COCKPIT"
5. ✓ Deve redirecionar para `/pre-evento`

### Teste 2: Senha Errada → Magic Link
1. Acesse `/login`
2. Digite email correto
3. Digite senha **errada**
4. Clique em "ACESSAR COCKPIT"
5. ✓ Deve mostrar erro + botão de magic link
6. Clique em "RECEBER LINK DE ACESSO VIA EMAIL"
7. ✓ Deve mostrar "Link enviado! Verifique seu email"
8. Abra inbox
9. Clique no link
10. ✓ Deve logar automaticamente

### Teste 3: Reset de Senha
1. Admin vai no Supabase Dashboard
2. `Authentication → Users → ... → Reset Password`
3. Usuário recebe email
4. Clica no link
5. ✓ Deve abrir `/reset-password`
6. Digite nova senha (mín. 8 chars)
7. Confirme a senha
8. Clique em "ALTERAR SENHA"
9. ✓ Deve redirecionar para `/pre-evento`

### Teste 4: Proteção de Rotas
1. Acesse `/admin` sem estar logado
2. ✓ Deve redirecionar para `/login`
3. Logue com usuário **não-admin**
4. Tente acessar `/admin`
5. ✓ Deve redirecionar para `/pre-evento`
6. Logue com `andre.buric@gmail.com` (admin)
7. Acesse `/admin`
8. ✓ Deve carregar normalmente

---

## 📝 Notas Importantes

### 1. Magic Link vs Senha

- **Senha é o método principal** (mais seguro)
- **Magic Link é fallback** (quando usuário esquece/erra senha)
- Magic Link **nunca** deve aparecer por padrão

### 2. Email Templates

Se precisar customizar os emails:
1. Acesse Supabase Dashboard
2. `Authentication → Email Templates`
3. Edite:
   - **Confirm signup**
   - **Magic Link**
   - **Reset Password**

### 3. Redirect URLs

**SEMPRE** adicione a URL de produção nos Redirect URLs do Supabase:
- Production: `https://neuro-app.brainpower.com.br/**`
- Staging: (se houver)
- Local: `http://localhost:5173/**`

### 4. RLS (Row Level Security)

Todas as tabelas têm RLS ativado:
- `profiles`: Usuários veem apenas seu próprio perfil
- `diagnostic_entries`: Usuários veem apenas seus diagnósticos
- `notifications`: Cada usuário vê apenas suas notificações

Admins (`is_admin = true`) têm acesso adicional via policies específicas.

---

## 🚀 Deploy Checklist

Antes de ir para produção:

- [ ] Site URL configurado no Supabase
- [ ] Redirect URLs adicionados (incluindo `/reset-password`)
- [ ] Email templates customizados (opcional)
- [ ] HTTPS ativo no domínio
- [ ] Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Testar login com senha
- [ ] Testar magic link
- [ ] Testar reset de senha
- [ ] Testar proteção de rotas admin

---

## 🆘 Troubleshooting

### "Invalid login credentials"

**Causa:** Email ou senha incorretos, ou email não confirmado

**Solução:**
1. Verifique se o email existe no Supabase (`Authentication → Users`)
2. Verifique se `email_confirmed_at` não está `null`
3. Se necessário, confirme manualmente no dashboard
4. Ou use "Reset Password" para criar nova senha

### "Redirect URL not whitelisted"

**Causa:** URL de redirect não está configurada no Supabase

**Solução:**
1. Acesse `Authentication → URL Configuration`
2. Adicione a URL aos **Redirect URLs**
3. Use wildcard: `https://neuro-app.brainpower.com.br/**`

### Magic Link não funciona

**Causa:** Email não chegou, ou token expirado

**Solução:**
1. Verifique spam
2. Verifique se `emailRedirectTo` está correto
3. Token expira em 1 hora - solicite novo link
4. Verifique logs do Supabase (`Logs → Edge Logs`)

### Usuário não é admin

**Causa:** `is_admin` flag não está `true` no banco

**Solução:**
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'andre.buric@gmail.com';
```

---

**Última atualização:** 2026-02-02
**Desenvolvido por:** Claude Code + Andre Buric
**Projeto:** Imersão Diagnóstico de Vendas
