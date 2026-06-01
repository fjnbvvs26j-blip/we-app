import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { homeService } from '@/features/home/home.service'
import type { PartnerInfo } from '@/features/home/home.types'

export default function PartnerBanner() {
  const { user } = useAuth()
  const [partner, setPartner] = useState<PartnerInfo>(null)

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
    <div className="card-warm !rounded-2xl p-4 mb-4 flex items-center gap-4 animate-fade-up">
      {/* 头像占位 */}
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: 'rgba(184, 101, 43, 0.08)' }}>
        🐻
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
          {partner.nickname}
        </p>
        {partner.target_school && (
          <p className="font-ui text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
            🎯 {partner.target_school}
          </p>
        )}
      </div>

      {/* 装饰 */}
      <div className="shrink-0">
        <span className="text-lg opacity-30">💕</span>
      </div>
    </div>
  )
}
