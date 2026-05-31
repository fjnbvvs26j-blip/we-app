import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/shared/lib/supabase'

type User = { id: string; email: string; nickname: string }

type AuthState = {
  user: User | null
  session: boolean
  profile: null
  loading: boolean
  signUp: (email: string, password: string, nickname: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)
const KEY = 'we_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  // 首次加载时，同步本地用户到 Supabase profiles
  useEffect(() => {
    if (user) syncProfile(user)
  }, [])

  async function syncProfile(u: User) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', u.id).single()
    if (!existing) {
      await supabase.from('profiles').insert({
        id: u.id,
        nickname: u.nickname,
      })
    }
  }

  async function signUp(email: string, _password: string, nickname: string) {
    const id = crypto.randomUUID()
    const u: User = { id, email, nickname: nickname || email.split('@')[0] }

    // 写入 Supabase profiles 表
    const { error } = await supabase.from('profiles').insert({
      id: u.id,
      nickname: u.nickname,
    })

    if (error) throw error

    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
  }

  async function signIn(email: string, _password: string) {
    // 从 Supabase 查找已有用户
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', email) // 暂时用 email 做简单匹配
      .single()

    let u: User
    if (existing) {
      u = { id: existing.id, email, nickname: existing.nickname }
    } else {
      // 新用户，创建
      u = { id: crypto.randomUUID(), email, nickname: email.split('@')[0] }
      await supabase.from('profiles').insert({ id: u.id, nickname: u.nickname })
    }

    localStorage.setItem(KEY, JSON.stringify(u))
    setUser(u)
  }

  async function signOut() {
    localStorage.removeItem(KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      session: !!user,
      profile: null,
      loading,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
