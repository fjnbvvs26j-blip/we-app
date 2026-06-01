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
      if (mode === 'login') {
        setSuccess('登录中...')
        await signIn(email, password)
      } else {
        setSuccess('注册中...')
        await signUp(email, password, nickname)
        setSuccess('注册成功！')
      }
    } catch (err: any) {
      const msg = err?.message || err?.msg || '出错了'
      setError(msg)
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* 装饰背景 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 暖光光晕 */}
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-terracotta-light), transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, var(--color-sage), transparent)' }} />
        {/* 倾斜的装饰线 */}
        <div className="absolute top-1/4 -left-8 w-32 h-px rotate-12 opacity-30" style={{ background: 'linear-gradient(90deg, transparent, var(--color-terracotta-light))' }} />
        <div className="absolute bottom-1/3 -right-8 w-24 h-px -rotate-12 opacity-20" style={{ background: 'linear-gradient(90deg, var(--color-sage), transparent)' }} />
        {/* 分散的小点 */}
        <div className="absolute top-[20%] right-[15%] w-1 h-1 rounded-full opacity-20" style={{ backgroundColor: 'var(--color-terracotta)' }} />
        <div className="absolute top-[35%] left-[10%] w-1.5 h-1.5 rounded-full opacity-15" style={{ backgroundColor: 'var(--color-sage)' }} />
        <div className="absolute bottom-[30%] right-[20%] w-1 h-1 rounded-full opacity-25" style={{ backgroundColor: 'var(--color-terracotta-light)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* 品牌区 */}
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-bold tracking-wide" style={{ color: 'var(--color-ink)' }}>
            我们
          </h1>
          <p className="font-body text-base mt-3 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
            两个人的小空间
          </p>
          {/* 装饰分隔 */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="deco-dot" />
            <div className="w-8 h-px" style={{ backgroundColor: 'var(--color-warm-border)' }} />
            <span className="deco-dot" />
            <div className="w-8 h-px" style={{ backgroundColor: 'var(--color-warm-border)' }} />
            <span className="deco-dot" />
          </div>
        </div>

        {/* 表单卡片 */}
        <div className="relative">
          {/* 外层阴影卡片 */}
          <div className="card-warm !rounded-2xl p-7 relative overflow-hidden"
            style={{ boxShadow: '0 2px 4px rgba(44,24,16,0.04), 0 8px 32px rgba(44,24,16,0.05), 0 0 0 1px rgba(232,221,208,0.5)' }}>
            {/* 顶部装饰线 */}
            <div className="absolute top-0 left-8 right-8 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, var(--color-terracotta-light), transparent)' }} />

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="animate-fade-up">
                  <label className="block font-ui text-[11px] font-medium mb-1.5 tracking-wide" style={{ color: 'var(--color-ink-soft)' }}>
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
                <label className="block font-ui text-[11px] font-medium mb-1.5 tracking-wide" style={{ color: 'var(--color-ink-soft)' }}>
                  邮箱
                </label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-warm"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block font-ui text-[11px] font-medium mb-1.5 tracking-wide" style={{ color: 'var(--color-ink-soft)' }}>
                  密码
                </label>
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-warm"
                  placeholder="至少 6 位"
                />
              </div>

              {error && (
                <div className="animate-fade-in rounded-xl px-4 py-2.5" style={{ backgroundColor: 'rgba(194, 120, 92, 0.06)' }}>
                  <p className="font-ui text-[11px] text-center" style={{ color: 'var(--color-rose-warm)' }}>{error}</p>
                </div>
              )}
              {success && (
                <div className="animate-fade-in rounded-xl px-4 py-2.5" style={{ backgroundColor: 'rgba(107, 143, 113, 0.06)' }}>
                  <p className="font-ui text-[11px] text-center flex items-center justify-center gap-1.5" style={{ color: 'var(--color-sage)' }}>
                    {loading && <span className="w-3.5 h-3.5 border-2 border-sage/30 border-t-sage rounded-full animate-spin" />}
                    {success}
                  </p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full !rounded-xl py-3 text-[15px]"
                style={{
                  background: loading ? 'var(--color-ink-muted)' : 'linear-gradient(135deg, #B8652B 0%, #C8753A 50%, #D4874A 100%)',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(184, 101, 43, 0.25)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="opacity-70">处理中…</span>
                  </span>
                ) : mode === 'login' ? '登录' : '注册'}
              </button>

              <div className="text-center pt-1">
                <span className="font-ui text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                  {mode === 'login' ? '还没有账号？' : '已有账号？'}
                </span>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="font-ui text-[11px] ml-1.5 font-semibold transition-colors hover:underline underline-offset-2"
                  style={{ color: 'var(--color-terracotta)' }}
                >
                  {mode === 'login' ? '注册新账号' : '去登录'}
                </button>
              </div>
            </form>

            {/* 底部装饰线 */}
            <div className="absolute bottom-0 left-8 right-8 h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent, var(--color-terracotta-light), transparent)' }} />
          </div>
        </div>

        {/* 底部文字 */}
        <p className="text-center mt-10 font-body text-[11px] tracking-[0.2em]" style={{ color: 'var(--color-ink-muted)', opacity: 0.4 }}>
          · 属于我们的角落 ·
        </p>
      </div>
    </div>
  )
}
