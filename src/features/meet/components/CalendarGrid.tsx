import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { meetService } from '@/features/meet/meet.service'
import CalendarDayCell from './CalendarDay'
import DayEditor from './DayEditor'
import type { CalendarDay, CalendarEntry } from '../meet.types'

type Props = {
  onViewMeeting?: (date: string) => void
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export default function CalendarGrid({ onViewMeeting }: Props) {
  const { user } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [myEntries, setMyEntries] = useState<CalendarEntry[]>([])
  const [partnerEntries, setPartnerEntries] = useState<CalendarEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [editingDay, setEditingDay] = useState<CalendarDay | null>(null)

  // 年月变化时重新加载数据
  useEffect(() => {
    loadMonth()
  }, [year, month, user?.id, user?.partner_id])

  async function loadMonth() {
    if (!user) return
    setLoaded(false)
    try {
      const data = await meetService.getMonthEntries(user.id, user.partner_id, year, month)
      setMyEntries(data.myEntries)
      setPartnerEntries(data.partnerEntries)
    } catch (e) {
      console.error('Failed to load calendar:', e)
    }
    setLoaded(true)
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    // reload on next render via effect
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // Build calendar days
  const days = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday first
    const totalDays = lastDay.getDate()
    const todayStr = now.toISOString().split('T')[0]

    const result: CalendarDay[] = []

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i)
      result.push({
        date: d.toISOString().split('T')[0],
        dayOfMonth: d.getDate(),
        dayOfWeek: d.getDay(),
        isCurrentMonth: false,
        isToday: false,
        myEntry: null,
        partnerEntry: null,
      })
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month - 1, d)
      const dateStr = date.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        dayOfMonth: d,
        dayOfWeek: date.getDay(),
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        myEntry: myEntries.find(e => e.date === dateStr) || null,
        partnerEntry: partnerEntries.find(e => e.date === dateStr) || null,
      })
    }

    // Pad to fill last row
    const remaining = 7 - (result.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month, i)
        result.push({
          date: d.toISOString().split('T')[0],
          dayOfMonth: d.getDate(),
          dayOfWeek: d.getDay(),
          isCurrentMonth: false,
          isToday: false,
          myEntry: null,
          partnerEntry: null,
        })
      }
    }

    return result
  }, [year, month, myEntries, partnerEntries])

  function handleDayClick(day: CalendarDay) {
    if (!day.isCurrentMonth) return
    setEditingDay(day)
  }

  async function handleSave(date: string, fields: { content?: string | null; is_available?: boolean; is_meeting_day?: boolean }) {
    if (!user) return
    await meetService.upsertDayEntry(user.id, date, fields)
    setEditingDay(null)
    loadMonth()
    // If marking as meeting day, auto-create a meeting plan
    if (fields.is_meeting_day && onViewMeeting) {
      onViewMeeting(date)
    }
  }

  return (
    <div className="animate-fade-up">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 active:scale-90"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <h2 className="font-display text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
          {year}年 {MONTHS[month - 1]}
        </h2>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 active:scale-90"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1.5">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center font-ui text-[10px] py-1" style={{ color: 'var(--color-ink-muted)' }}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {!loaded ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day, i) => (
            <CalendarDayCell key={`${day.date}-${i}`} day={day} onClick={handleDayClick} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <span className="inline-flex items-center gap-1 font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-terracotta)' }} /> 我的
        </span>
        <span className="inline-flex items-center gap-1 font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-rose-warm)' }} /> 伴侣
        </span>
        <span className="inline-flex items-center gap-1 font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }} /> 有空
        </span>
      </div>

      {/* Day Editor bottom sheet */}
      {editingDay && (
        <DayEditor
          day={editingDay}
          onSave={handleSave}
          onClose={() => setEditingDay(null)}
          onViewMeeting={onViewMeeting}
        />
      )}
    </div>
  )
}
