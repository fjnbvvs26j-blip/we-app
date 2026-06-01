import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { homeService } from '@/features/home/home.service'
import type { PartnerInfo } from '@/features/home/home.types'

export default function PartnerBanner() {
  const { user } = useAuth()
  const [partner, setPartner] = useState<PartnerInfo>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!user?.invite_code) return
    try {
      await navigator.clipboard.writeText(user.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  useEffect(() => {
    if (!user?.partner_id) return
    homeService.getPartnerInfo(user.partner_id).then(setPartner).catch(() => {})
  }, [user?.partner_id])

  if (!partner) {
    return (
      <div className="card-warm !rounded-2xl p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'rgba(232,221,208,0.5)' }} />
        <div>
          <div className="h-3 w-16 rounded mb-1" style={{ backgroundColor: 'var(--color-warm-border)' }} />
          <div className="h-2 w-10 rounded" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="card-warm !rounded-2xl p-4 mb-4 animate-fade-up relative overflow-hidden card-lift">
      {/* 左侧色条 */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full opacity-25"
        style={{ backgroundColor: 'var(--color-terracotta)' }} />

      <div className="flex items-center gap-4">
        {/* 头像 */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 relative"
          style={{ backgroundColor: 'rgba(184, 101, 43, 0.06)', border: '1.5px solid rgba(184, 101, 43, 0.12)' }}>
          <span className="animate-heartbeat" style={{ fontSize: '1.25rem' }}>💕</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              {partner.nickname}
            </p>
            <span className="font-ui text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(184, 101, 43, 0.06)', color: 'var(--color-terracotta)', opacity: 0.6 }}>
              伴侣
            </span>
          </div>
          {partner.target_school ? (
            <p className="font-ui text-[11px] mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
              🎯 目标：{partner.target_school}
            </p>
          ) : (
            <p className="font-ui text-[11px] mt-0.5 opacity-30" style={{ color: 'var(--color-ink-muted)' }}>
              还没有设置目标院校
            </p>
          )}
        </div>
      </div>

      {/* 邀请码分享（方便发给还没关联的人） */}
      {user?.invite_code && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(232, 221, 208, 0.5)' }}>
          <div className="flex items-center justify-between">
            <span className="font-ui text-[10px] opacity-40" style={{ color: 'var(--color-ink-muted)' }}>
              我的邀请码
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.15em] font-semibold select-all" style={{ color: 'var(--color-ink-soft)' }}>
                {user.invite_code}
              </span>
              <button
                onClick={handleCopy}
                className="font-ui text-[10px] font-medium px-2 py-0.5 rounded-full transition-all active:scale-90"
                style={{
                  backgroundColor: copied ? 'var(--color-sage)' : 'rgba(184, 101, 43, 0.08)',
                  color: copied ? 'white' : 'var(--color-terracotta)',
                }}
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
