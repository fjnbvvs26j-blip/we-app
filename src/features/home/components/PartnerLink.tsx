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
    <div className="card-warm !rounded-2xl p-6 mb-4 text-center animate-scale-in">
      {/* 装饰 */}
      <span className="text-4xl mb-3 block">💑</span>
      <h3 className="font-display text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
        关联伴侣
      </h3>
      <p className="font-ui text-[11px] leading-relaxed mb-5" style={{ color: 'var(--color-ink-muted)' }}>
        <span className="opacity-60">关联后可以看到彼此的状态和互动</span>
      </p>

      {/* 我的邀请码 */}
      <div className="mb-5">
        <p className="font-ui text-[10px] mb-2" style={{ color: 'var(--color-ink-muted)' }}>我的邀请码</p>
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ backgroundColor: 'rgba(232,221,208,0.3)' }}>
          <span className="font-mono text-lg tracking-[0.15em] font-semibold" style={{ color: 'var(--color-terracotta)' }}>
            {user?.invite_code || '······'}
          </span>
          <button
            onClick={handleCopy}
            className="font-ui text-[10px] font-medium px-2 py-1 rounded-full transition-all active:scale-90"
            style={{
              backgroundColor: copied ? 'var(--color-sage)' : 'rgba(184, 101, 43, 0.1)',
              color: copied ? 'white' : 'var(--color-terracotta)',
            }}
          >
            {copied ? '已复制 ✓' : '复制'}
          </button>
        </div>
        <p className="font-ui text-[10px] mt-2 opacity-40" style={{ color: 'var(--color-ink-muted)' }}>
          发给 TA，让 TA 输入到下方
        </p>
      </div>

      {/* 分隔 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        <span className="font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>或者</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-warm-border)' }} />
      </div>

      {/* 输入伴侣邀请码 */}
      <div>
        <p className="font-ui text-[10px] mb-2" style={{ color: 'var(--color-ink-muted)' }}>输入 TA 的邀请码</p>
        <input
          ref={inputRef}
          type="text"
          value={inviteInput}
          onChange={e => { setInviteInput(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') handleLink() }}
          placeholder="6位邀请码"
          maxLength={10}
          className="input-warm text-center font-mono tracking-[0.1em] text-sm"
          style={{ padding: '10px 16px' }}
        />
        {error && (
          <p className="font-ui text-[10px] mt-1.5" style={{ color: 'var(--color-rose-warm)' }}>{error}</p>
        )}
        <button
          onClick={handleLink}
          disabled={submitting || inviteInput.trim().length < 4}
          className="btn-primary mt-3 w-full"
        >
          {submitting ? '查找中…' : '关联伴侣'}
        </button>
      </div>
    </div>
  )
}
