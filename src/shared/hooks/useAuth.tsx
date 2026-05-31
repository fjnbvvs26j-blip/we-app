import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { authService } from '@/features/auth/auth.service'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 启动时：检查是否有已有 Supabase 会话
  useEffect(() => {
    checkSession()

    // 监听 auth 状态变化（登录、登出、token 刷新等）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email!)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email!)
      }
    } catch {
      // 静默处理，未登录
    }
    setLoading(false)
  }

  async function loadProfile(uid: string, email: string) {
    // 从 profiles 表拉取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()

    // 如果 profile 不存在（auth_trigger 可能未执行），创建它
    if (!profile) {
      const nickname = email.split('@')[0]
      await supabase.from('profiles').upsert({ id: uid, nickname })
      setUser({ id: uid, email, nickname })
    } else {
      setUser({ id: uid, email, nickname: profile.nickname })
    }
  }

  async function signUp(email: string, password: string, nickname: string) {
    const { data, error } = await authService.signUp(email, password, nickname)
    if (error) throw error

    // 邮箱已注册但用户未确认：Supabase 返回 { user, session: null } 无 error
    if (!data.user) {
      throw new Error('邮箱已注册，请直接登录')
    }

    if (data.session) {
      // 关闭了邮箱验证：session 立即返回
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nickname: nickname || email.split('@')[0],
      })
      await loadProfile(data.user.id, data.user.email!)
    } else {
      // 开启了邮箱验证：没有 session → 自动补一次登录
      await signIn(email, password)
      return
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password)
    if (error) throw error

    if (data.user) {
      await loadProfile(data.user.id, data.user.email!)
    }
  }

  async function signOut() {
    await authService.signOut()
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
