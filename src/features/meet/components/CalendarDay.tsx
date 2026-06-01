import type { CalendarDay as CalendarDayType } from '../meet.types'

type Props = {
  day: CalendarDayType
  onClick: (day: CalendarDayType) => void
}

export default function CalendarDayCell({ day, onClick }: Props) {
  if (!day.isCurrentMonth) {
    return <div className="h-full min-h-[52px]" />
  }

  const hasMyContent = day.myEntry?.content
  const hasPartnerContent = day.partnerEntry?.content
  const isMeetingDay = day.myEntry?.is_meeting_day || day.partnerEntry?.is_meeting_day
  const myAvailable = day.myEntry?.is_available
  const partnerAvailable = day.partnerEntry?.is_available

  return (
    <button
      onClick={() => onClick(day)}
      className="relative flex flex-col items-center w-full py-1.5 rounded-xl transition-all duration-150 active:scale-95"
      style={{
        backgroundColor: day.isToday ? 'rgba(184, 101, 43, 0.06)' : 'transparent',
        border: day.isToday ? '1.5px solid rgba(184, 101, 43, 0.25)' : '1.5px solid transparent',
      }}
    >
      {/* 日期数字 */}
      <span
        className="font-ui text-xs font-medium leading-none"
        style={{
          color: day.isToday ? 'var(--color-terracotta)' : 'var(--color-ink-soft)',
        }}
      >
        {day.dayOfMonth}
      </span>

      {/* 我的侧边状态指示 */}
      <div className="flex items-center gap-0.5 mt-1">
        <div className="flex flex-col items-center gap-0.5">
          {hasMyContent && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-terracotta)' }} />
          )}
          {myAvailable && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }} />
          )}
        </div>
        {/* 分割 */}
        <span className="w-px h-3 rounded-full opacity-15" style={{ backgroundColor: 'var(--color-ink)' }} />
        {/* 伴侣侧边状态指示 */}
        <div className="flex flex-col items-center gap-0.5">
          {hasPartnerContent && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-rose-warm)' }} />
          )}
          {partnerAvailable && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }} />
          )}
        </div>
      </div>

      {/* 见面日星标 */}
      {isMeetingDay && (
        <span className="absolute -top-0.5 -right-0.5 text-[9px] leading-none">★</span>
      )}
    </button>
  )
}
