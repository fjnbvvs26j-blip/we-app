import { useState, useRef } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'

export default function PartnerLink() {
  const { user, linkPartner } = useAuth()
  const [inviteInput, setInviteInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleCopy() {
    if (!user?.invite_code) return
    try {
      await navigator.clipboard.writeText(user.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for non-HTTPS
      inputRef.current?.select()
    }
  }

  async function handleLink() {
    const code = inviteInput.trim().toLowerCase()
    if (!code || code.length < 4) {
      setError('请输入有效的邀请码')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await linkPartner(code)
    } catch (e) {
      setError(e instanceof Error ? e.message : '关联失败')
    }
    setSubmitting(false)
  }

  return (
    <div className="card-warm !rounded-2xl p-6 mb-4 text-center animate-scale-in relative overflow-hidden">
      {/* 顶部装饰 */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-30"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-terracotta-light), transparent)' }} />

      {/* 主图标 */}
      <div className="relative inline-block mb-4">
        <span className="text-5xl block animate-heartbeat">💕</span>
        <div className="absolute -inset-4 rounded-full blur-xl opacity-10"
          style={{ background: 'radial-gradient(circle, var(--color-terracotta-light), transparent)' }} />
      </div>

      <h3 className="font-display text-base font-semibold mb-1.5" style={{ color: 'var(--color-ink)' }}>
        关联伴侣
      </h3>
      <p className="font-body text-xs leading-relaxed mb-4 opacity-50" style={{ color: 'var(--color-ink-soft)' }}>
        输入 TA 的邀请码，双方自动关联
      </p>
      <p className="font-ui text-[10px] px-3 py-1.5 rounded-full inline-block mb-6"
        style={{ backgroundColor: 'rgba(107, 143, 113, 0.06)', color: 'var(--color-sage)' }}>
        ✨ 只需一方绑定，双向自动关联
      </p>

      {/* 我的邀请码 */}
      <div className="mb-6 px-2">
        <p className="font-ui text-[10px] mb-2.5 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
          ✉️ 我的邀请码
        </p>
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            backgroundColor: 'rgba(232,221,208,0.25)',
            border: '1px dashed var(--color-warm-border)',
          }}>
          <span className="font-mono text-xl tracking-[0.2em] font-bold select-all" style={{ color: 'var(--color-terracotta)' }}>
            {user?.invite_code || '······'}
          </span>
          <button
            onClick={handleCopy}
            className="font-ui text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-90"
            style={{
              backgroundColor: copied ? 'var(--color-sage)' : 'var(--color-terracotta)',
              color: 'white',
            }}
          >
            {copied ? '已复制 ✓' : '复制'}
          </button>
        </div>
        <p className="font-ui text-[10px] mt-2 opacity-35" style={{ color: 'var(--color-ink-muted)' }}>
          发给 TA，让 TA 在下方的输入框中填写
        </p>
      </div>

      {/* 分隔 */}
      <div className="flex items-center gap-3 mb-6 px-4">
        <div className="flex-1 h-px opacity-30" style={{ background: 'linear-gradient(90deg, transparent, var(--color-ink-muted))' }} />
        <span className="font-ui text-[10px] opacity-30" style={{ color: 'var(--color-ink-muted)' }}>TA 的邀请码</span>
        <div className="flex-1 h-px opacity-30" style={{ background: 'linear-gradient(90deg, var(--color-ink-muted), transparent)' }} />
      </div>

      {/* 输入伴侣邀请码 */}
      <div className="px-2">
        <input
          ref={inputRef}
          type="text"
          value={inviteInput}
          onChange={e => { setInviteInput(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') handleLink() }}
          placeholder="输入 6 位邀请码"
          maxLength={10}
          className="input-warm text-center font-mono tracking-[0.15em] text-base"
          style={{ padding: '12px 16px', fontSize: '1.1rem' }}
        />
        {error && (
          <p className="font-ui text-[10px] mt-2 animate-fade-in" style={{ color: 'var(--color-rose-warm)' }}>{error}</p>
        )}
        <button
          onClick={handleLink}
          disabled={submitting || inviteInput.trim().length < 4}
          className="btn-primary mt-3 w-full !rounded-xl py-3 text-[15px]"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              查找中…
            </span>
          ) : '💕 关联伴侣'}
        </button>
      </div>
    </div>
  )
}
