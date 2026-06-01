import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { meetService } from './meet.service'
import MeetingDetail from './components/MeetingDetail'
import MeetingEditor from './components/MeetingEditor'
import SuggestionPanel from './components/SuggestionPanel'
import type { MeetingPlan, Suggestion, CalendarEntry } from './meet.types'

type ViewMode = 'detail' | 'edit' | 'suggest' | 'empty'

export default function MeetingPlanPage() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [plan, setPlan] = useState<MeetingPlan | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [mode, setMode] = useState<ViewMode>('empty')
  const [myEntries, setMyEntries] = useState<CalendarEntry[]>([])
  const [partnerEntries, setPartnerEntries] = useState<CalendarEntry[]>([])

  useEffect(() => {
    if (!date) return
    loadPlan(date)
    loadCalendarEntries()
  }, [date])

  async function loadPlan(d: string) {
    setLoaded(false)
    try {
      const existing = await meetService.getMeetingByDate(d)
      if (existing) {
        setPlan(existing)
        setMode('detail')
      } else {
        setPlan(null)
        setMode('empty')
      }
    } catch (e) {
      console.error('Failed to load plan:', e)
    }
    setLoaded(true)
  }

  async function loadCalendarEntries() {
    if (!user) return
    try {
      const d = new Date(date + 'T00:00:00')
      const data = await meetService.getMonthEntries(user.id, user.partner_id, d.getFullYear(), d.getMonth() + 1)
      setMyEntries(data.myEntries)
      setPartnerEntries(data.partnerEntries)
    } catch { /* ignore */ }
  }

  async function handleSave(p: Partial<MeetingPlan> & { meet_date: string }) {
    const result = await meetService.upsertMeetingPlan(p)
    setPlan(result)
    setMode('detail')
  }

  async function handleDelete() {
    if (!plan) return
    await meetService.deleteMeetingPlan(plan.id)
    navigate(-1)
  }

  function handleApplySuggestion(s: Suggestion) {
    if (s.apply?.study_hours !== undefined || s.apply?.date_hours !== undefined) {
      // Apply time split suggestion
      setPlan(prev => prev ? {
        ...prev,
        study_hours: Number(s.apply?.study_hours) || prev.study_hours,
        date_hours: Number(s.apply?.date_hours) || prev.date_hours,
      } : prev)
    }

    if (s.apply?.tasks && plan && date) {
      // Apply activity tasks
      const tasks = s.apply?.tasks as Array<{ task_type: string; title: string; duration_minutes: number; sort_order: number }>
      Promise.all(tasks.map(t =>
        meetService.addTask(plan.id, {
          task_type: t.task_type as 'study' | 'date' | 'other',
          title: t.title,
          duration_minutes: t.duration_minutes,
          sort_order: t.sort_order,
        })
      )).then(() => loadPlan(date!))

      // Update time split
      if (s.apply?.study_hours || s.apply?.date_hours) {
        meetService.updateMeetingPlan(plan.id, {
          study_hours: Number(s.apply?.study_hours) || plan.study_hours,
          date_hours: Number(s.apply?.date_hours) || plan.date_hours,
        }).then(p => setPlan(p))
      }
    }

    if (s.apply?.transport && plan && date) {
      meetService.updateMeetingPlan(plan.id, {
        transport: s.apply?.transport as string,
      }).then(p => setPlan(p))
    }
  }

  if (!date) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
        <p className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>缺少日期参数</p>
      </div>
    )
  }

  const d = new Date(date + 'T00:00:00')
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDay}`

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:bg-black/5 active:scale-90"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
          见面规划
        </h1>
        <div className="w-8" />
      </header>

      <div className="px-5">
        {!loaded ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }} />
          </div>
        ) : mode === 'empty' ? (
          <div className="card-warm !rounded-2xl p-8 text-center mt-4 animate-fade-up">
            <span className="text-4xl block mb-3">📅</span>
            <p className="font-display text-base font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
              {dateLabel}
            </p>
            <p className="font-body text-sm mb-6" style={{ color: 'var(--color-ink-soft)' }}>
              还没有见面计划，开始创建吧
            </p>
            <button
              onClick={() => setMode('edit')}
              className="btn-primary text-sm"
            >
              创建见面规划
            </button>
          </div>
        ) : mode === 'detail' && plan ? (
          <MeetingDetail
            plan={plan}
            onEdit={() => setMode('edit')}
            onDelete={handleDelete}
            onSuggest={() => setMode('suggest')}
          />
        ) : mode === 'edit' ? (
          <MeetingEditor
            plan={plan || { meet_date: date, status: 'planning', tasks: [] }}
            onSave={handleSave}
            onCancel={() => plan ? setMode('detail') : navigate(-1)}
          />
        ) : null}
      </div>

      {/* Suggestion Panel */}
      {mode === 'suggest' && (
        <SuggestionPanel
          plan={plan || { meet_date: date, status: 'planning', tasks: [] }}
          myEntries={myEntries}
          partnerEntries={partnerEntries}
          year={d.getFullYear()}
          month={d.getMonth() + 1}
          onApply={handleApplySuggestion}
          onClose={() => setMode(plan ? 'detail' : 'empty')}
        />
      )}
    </div>
  )
}
