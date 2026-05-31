import { useState } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') await signIn(email, password)
      else {
        await signUp(email, password, nickname)
        setSuccess('注册成功！如未自动登录，请检查邮箱验证链接。')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '出错了')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      {/* 装饰背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[#D4874A]/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-[#8FB596]/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-px h-24 bg-gradient-to-b from-[#E8DDD0] to-transparent" />
        <div className="absolute top-1/2 right-1/4 w-px h-16 bg-gradient-to-b from-[#E8DDD0] to-transparent" />
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        {/* 品牌区 */}
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-bold tracking-wide" style={{ color: 'var(--color-ink)' }}>
            我们
          </h1>
          <p className="font-body text-base mt-2" style={{ color: 'var(--color-ink-muted)' }}>
            两个人的小空间
          </p>
          <div className="w-12 h-[2px] mx-auto mt-4 rounded-full bg-gradient-to-r from-[#D4874A]/40 via-[#B8652B] to-[#D4874A]/40" />
        </div>

        {/* 表单卡片 */}
        <div className="card-warm p-7 relative">
          {/* 装饰角标 */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: 'var(--color-terracotta-light)' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: 'var(--color-terracotta-light)' }} />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {mode === 'signup' && (
              <div className="animate-fade-up">
                <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                  昵称
                </label>
                <input
                  type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
                  className="input-warm"
                  placeholder="你想被怎么称呼"
                />
              </div>
            )}

            <div>
              <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                邮箱
              </label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-warm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block font-ui text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                密码
              </label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-warm"
                placeholder="至少 6 位"
              />
            </div>

            {error && (
              <p className="font-ui text-xs text-center animate-fade-in" style={{ color: '#C2785C' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="font-ui text-xs text-center animate-fade-in" style={{ color: 'var(--color-sage)' }}>
                {success}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full !rounded-xl py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中…
                </span>
              ) : mode === 'login' ? '登录' : '注册'}
            </button>

            <div className="text-center">
              <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                {mode === 'login' ? '还没有账号？' : '已有账号？'}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-ui text-xs ml-1 font-medium transition-colors hover:underline"
                style={{ color: 'var(--color-terracotta)' }}
              >
                {mode === 'login' ? '注册' : '登录'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部装饰 */}
        <p className="text-center mt-8 font-ui text-[11px] tracking-widest uppercase" style={{ color: 'var(--color-warm-border)' }}>
          &sdot; 属于我们的角落 &sdot;
        </p>
      </div>
    </div>
  )
}
