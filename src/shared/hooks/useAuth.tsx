import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { authService } from '@/features/auth/auth.service'

type User = {
  id: string
  email: string
  nickname: string
  partner_id: string | null
  target_school: string | null
  invite_code: string | null
}

type AuthState = {
  user: User | null
  session: boolean
  profile: null
  loading: boolean
  signUp: (email: string, password: string, nickname: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  linkPartner: (inviteCode: string) => Promise<void>
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
      setUser({ id: uid, email, nickname, partner_id: null, target_school: null, invite_code: null })
    } else {
      setUser({
        id: uid,
        email,
        nickname: profile.nickname,
        partner_id: profile.partner_id ?? null,
        target_school: profile.target_school ?? null,
        invite_code: profile.invite_code ?? null,
      })
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

  async function refreshProfile() {
    const { data } = await supabase.auth.getSession()
    const sessionUser = data.session?.user
    if (sessionUser) {
      await loadProfile(sessionUser.id, sessionUser.email!)
    }
  }

  async function linkPartner(inviteCode: string) {
    // 1. 按邀请码查找伴侣
    const { data: partner, error } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('invite_code', inviteCode.toLowerCase())
      .single()

    if (error || !partner) {
      throw new Error('未找到该邀请码，请确认后重试')
    }

    const currentUser = user
    if (!currentUser) throw new Error('请先登录')

    if (partner.id === currentUser.id) {
      throw new Error('不能关联自己的邀请码')
    }

    // 2. 调用 SECURITY DEFINER 函数，单方输入即双向绑定
    const { error: rpcError } = await supabase.rpc('link_partners', {
      linker_id: currentUser.id,
      target_id: partner.id,
    })

    if (rpcError) throw new Error('关联失败，请重试')

    // 3. 刷新本地状态
    await refreshProfile()
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
      refreshProfile,
      linkPartner,
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
