import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { vocabService } from '@/features/vocab/vocab.service'
import type { QuickStatsData } from '@/features/home/home.types'

export default function QuickStats() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<QuickStatsData | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      vocabService.getDailyStats(user.id),
      vocabService.getStats(user.id),
    ]).then(([daily, vocab]) => {
      setStats({
        todayReviewed: daily.todayReviewed,
        todayNew: daily.todayNew,
        streak: daily.streak,
        goal: daily.goal,
        knownTotal: vocab.known,
        learningTotal: vocab.learning,
      })
    }).catch(() => {})
  }, [user])

  if (!stats) {
    return (
      <div className="card-warm !rounded-2xl p-5 mb-3">
        <p className="font-ui text-[10px] mb-2 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>学习概览</p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl py-3 px-3 animate-pulse" style={{ backgroundColor: 'rgba(232,221,208,0.4)' }}>
              <div className="h-5 w-8 rounded mx-auto mb-1" style={{ backgroundColor: 'var(--color-warm-border)' }} />
              <div className="h-3 w-12 rounded mx-auto" style={{ backgroundColor: 'var(--color-warm-border)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { value: stats.todayReviewed, label: '今日复习', color: 'var(--color-terracotta)' },
    { value: stats.knownTotal, label: '已掌握', color: 'var(--color-sage)' },
    { value: `${stats.streak}天`, label: '连续打卡', color: 'var(--color-terracotta-light)' },
  ]

  return (
    <div className="card-warm !rounded-2xl p-5 mb-3 animate-fade-up">
      <p className="font-ui text-[10px] mb-3 tracking-[0.1em] uppercase" style={{ color: 'var(--color-ink-muted)' }}>学习概览</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={() => navigate('/vocab')}
            className="flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 active:scale-95 card-lift"
            style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(232,221,208,0.3)' }}
          >
            <span className="num-display text-xl font-bold" style={{ color: c.color }}>{c.value}</span>
            <span className="font-ui text-[10px] mt-1 opacity-60" style={{ color: 'var(--color-ink-muted)' }}>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
