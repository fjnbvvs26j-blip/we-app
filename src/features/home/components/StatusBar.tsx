import { useState, useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { homeService } from '@/features/home/home.service'
import type { PartnerStatus } from '@/features/home/home.types'

const STATUS_OPTIONS: { key: 'studying' | 'resting' | 'missing_you' | 'free_to_chat' | 'custom'; label: string; emoji: string }[] = [
  { key: 'studying', label: '学习', emoji: '📚' },
  { key: 'resting', label: '休息', emoji: '☕' },
  { key: 'missing_you', label: '想你', emoji: '💕' },
  { key: 'free_to_chat', label: '有空', emoji: '💬' },
  { key: 'custom', label: '自定义', emoji: '✏️' },
]

export default function StatusBar() {
  const { user } = useAuth()
  const [myStatus, setMyStatus] = useState<string | null>(null)
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    homeService.getMyStatus(user.id).then(s => {
      if (s) setMyStatus(s.status)
    }).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user?.partner_id) return
    homeService.getPartnerStatus(user.partner_id).then(setPartnerStatus).catch(() => {})
  }, [user?.partner_id])

  async function handleSetStatus(s: typeof STATUS_OPTIONS[0]) {
    if (!user || saving) return
    setSaving(true)
    setMyStatus(s.key)
    try {
      await homeService.setMyStatus(user.id, s.key)
    } catch { /* 静默 */ }
    setSaving(false)
  }

  return (
    <div className="card-warm !rounded-2xl p-5 mb-3 animate-fade-up">
      {/* 我的状态 */}
      <p className="font-ui text-[10px] mb-3 tracking-[0.1em] uppercase" style={{ color: 'var(--color-ink-muted)' }}>
        我的状态
      </p>
      <div className="flex justify-between gap-1.5">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => handleSetStatus(s)}
            disabled={saving}
            className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl transition-all duration-200 min-w-0 relative"
            style={{
              backgroundColor: myStatus === s.key ? 'rgba(184, 101, 43, 0.06)' : 'transparent',
              border: myStatus === s.key ? '1.5px solid rgba(184, 101, 43, 0.25)' : '1.5px solid transparent',
              transform: myStatus === s.key ? 'translateY(-1px)' : 'none',
              boxShadow: myStatus === s.key ? '0 2px 12px rgba(184, 101, 43, 0.08)' : 'none',
            }}
          >
            {/* 活跃指示点 */}
            {myStatus === s.key && (
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ backgroundColor: 'var(--color-terracotta)' }} />
            )}
            <span className="text-lg leading-none">{s.emoji}</span>
            <span className="font-ui text-[10px] leading-tight" style={{
              color: myStatus === s.key ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
              fontWeight: myStatus === s.key ? 600 : 400,
            }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* 伴侣状态 */}
      {user?.partner_id && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(232, 221, 208, 0.6)' }}>
          {partnerStatus ? (
            <div className="flex items-center justify-center gap-2.5">
              <span className="font-ui text-[11px] font-medium" style={{ color: 'var(--color-ink-soft)' }}>
                {partnerStatus.partner_nickname}
              </span>
              <span className="w-0.5 h-3 rounded-full opacity-20" style={{ backgroundColor: 'var(--color-ink)' }} />
              <span className="text-base">
                {STATUS_OPTIONS.find(s => s.key === partnerStatus.status)?.emoji || '💭'}
              </span>
              <span className="font-ui text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
                {STATUS_OPTIONS.find(s => s.key === partnerStatus.status)?.label || partnerStatus.status}
              </span>
              {partnerStatus.updated_at && (
                <span className="font-ui text-[10px] opacity-25" style={{ color: 'var(--color-ink-muted)' }}>
                  {timeAgo(partnerStatus.updated_at)}
                </span>
              )}
            </div>
          ) : (
            <p className="font-ui text-[10px] text-center opacity-25" style={{ color: 'var(--color-ink-muted)' }}>
              伴侣还没有设置状态
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}小时前`
  return `${Math.floor(hrs / 24)}天前`
}
