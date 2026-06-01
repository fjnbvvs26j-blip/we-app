import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import CalendarGrid from './components/CalendarGrid'

export default function CalendarPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  function handleViewMeeting(date: string) {
    navigate(`/meet/${date}`)
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
          日历
        </h1>
        {!user?.partner_id && (
          <span className="font-ui text-[10px] px-2.5 py-1 rounded-full" style={{
            backgroundColor: 'rgba(184, 101, 43, 0.06)',
            color: 'var(--color-terracotta)',
          }}>
            关联伴侣后双栏可见
          </span>
        )}
      </header>

      <div className="px-5 stagger">
        <CalendarGrid onViewMeeting={handleViewMeeting} />
      </div>
    </div>
  )
}
