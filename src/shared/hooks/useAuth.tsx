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
  // 不阻塞：直接显示登录页，session 在后台静默检查
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 后台检查已有会话（不阻塞渲染）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!).catch(() => {})
      }
    }).catch(() => {})

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email!).catch(() => setUser(null))
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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

    if (!data.user) {
      throw new Error('该邮箱已注册，请直接登录')
    }

    if (data.session) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nickname: nickname || email.split('@')[0],
      }).catch(() => {})
      await loadProfile(data.user.id, data.user.email!)
    } else {
      // 邮箱验证开启 → 自动补一次登录
      await signIn(email, password)
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await authService.signIn(email, password)
    if (error) throw error

    if (data.user) {
      try {
        await loadProfile(data.user.id, data.user.email!)
      } catch {
        // 加载 profile 失败不阻塞登录
        setUser({ id: data.user.id, email: data.user.email!, nickname: email.split('@')[0] })
      }
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
