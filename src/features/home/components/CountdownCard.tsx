import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { homeService } from '@/features/home/home.service'
import type { CountdownData } from '@/features/home/home.types'

export default function CountdownCard() {
  const [data, setData] = useState<CountdownData>(null)
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    homeService.getNextMeeting().then(d => { setData(d); setLoaded(true) }).catch(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <div className="card-warm !rounded-2xl p-6 mb-3 flex justify-center">
        <div className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card-warm !rounded-2xl p-8 mb-3 text-center animate-fade-up">
        <span className="text-4xl mb-3 block">📅</span>
        <p className="font-display text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
          还没有计划见面
        </p>
        <p className="font-ui text-[11px] mb-3" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="opacity-50">确定日期后会显示倒计时</span>
        </p>
        <button
          onClick={() => navigate('/calendar')}
          className="font-ui text-[10px] px-3 py-1.5 rounded-full transition-all hover:opacity-70"
          style={{
            color: 'var(--color-ink-muted)',
            backgroundColor: 'rgba(232, 221, 208, 0.3)',
          }}
        >
          📅 查看日历
        </button>
      </div>
    )
  }

  return (
    <div className="card-warm !rounded-2xl p-6 mb-3 text-center animate-fade-up relative overflow-hidden">
      {/* 装饰光晕 */}
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-terracotta-light), transparent)' }} />

      <p className="font-ui text-[10px] mb-3 tracking-[0.15em] uppercase" style={{ color: 'var(--color-ink-muted)' }}>
        距离下次见面
      </p>

      <div className="relative inline-flex items-baseline justify-center gap-1.5 mb-3">
        <span
          key={data.daysUntil}
          className="num-display text-[4.5rem] leading-none animate-number-pop"
          style={{ color: 'var(--color-terracotta)' }}
        >
          {data.daysUntil}
        </span>
        <span className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink-muted)' }}>天</span>
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="deco-dot opacity-40" />
        <p className="font-body text-xs" style={{ color: 'var(--color-ink-soft)' }}>
          {formatDate(data.meetDate)}
        </p>
        <span className="deco-dot opacity-40" />
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {data.fromCity && (
          <span className="inline-flex items-center gap-1 font-ui text-[10px] px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(184, 101, 43, 0.06)', color: 'var(--color-terracotta)' }}>
            🚄 {data.fromCity}
          </span>
        )}
        {data.meetStatus === 'confirmed' && (
          <span className="inline-flex items-center gap-1 font-ui text-[10px] px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(107, 143, 113, 0.08)', color: 'var(--color-sage)' }}>
            ✓ 已确认
          </span>
        )}
      </div>

      {/* 查看日历链接 */}
      <button
        onClick={() => navigate('/calendar')}
        className="w-full mt-3 py-2 rounded-xl font-ui text-[10px] font-medium transition-all hover:opacity-70"
        style={{
          color: 'var(--color-ink-muted)',
          backgroundColor: 'rgba(232, 221, 208, 0.3)',
        }}
      >
        📅 查看日历
      </button>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDay}`
}
