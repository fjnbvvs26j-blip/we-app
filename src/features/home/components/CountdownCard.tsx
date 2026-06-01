import { useState, useEffect } from 'react'
import { homeService } from '@/features/home/home.service'
import type { CountdownData } from '@/features/home/home.types'

export default function CountdownCard() {
  const [data, setData] = useState<CountdownData>(null)
  const [loaded, setLoaded] = useState(false)

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
        <p className="font-ui text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="opacity-50">确定日期后会显示倒计时</span>
        </p>
      </div>
    )
  }

  return (
    <div className="card-warm !rounded-2xl p-6 mb-3 text-center animate-fade-up">
      <p className="font-ui text-[10px] mb-2 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
        距离下次见面
      </p>
      <div className="flex items-baseline justify-center gap-1.5 mb-2">
        <span className="font-display text-[3.5rem] font-bold leading-none" style={{ color: 'var(--color-terracotta)' }}>
          {data.daysUntil}
        </span>
        <span className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink-muted)' }}>天</span>
      </div>
      <p className="font-body text-xs" style={{ color: 'var(--color-ink-soft)' }}>
        {formatDate(data.meetDate)}
      </p>
      {data.fromCity && (
        <span className="inline-block mt-2 font-ui text-[10px] px-2.5 py-1 rounded-full"
          style={{ backgroundColor: 'rgba(184, 101, 43, 0.06)', color: 'var(--color-terracotta)' }}>
          🚄 {data.fromCity}
        </span>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDay}`
}
