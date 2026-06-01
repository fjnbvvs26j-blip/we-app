import { useState } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import type { CalendarDay } from '../meet.types'

type Props = {
  day: CalendarDay
  onSave: (date: string, fields: { content?: string | null; is_available?: boolean; is_meeting_day?: boolean }) => Promise<void>
  onClose: () => void
  onViewMeeting?: (date: string) => void
}

export default function DayEditor({ day, onSave, onClose, onViewMeeting }: Props) {
  const { user } = useAuth()
  const [content, setContent] = useState(day.myEntry?.content || '')
  const [isAvailable, setIsAvailable] = useState(day.myEntry?.is_available || false)
  const [isMeetingDay, setIsMeetingDay] = useState(day.myEntry?.is_meeting_day || false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const date = new Date(day.date + 'T00:00:00')
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  const dateLabel = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`

  // 如果是未来日期，不可编辑
  const isFuture = new Date(day.date + 'T23:59:59') > new Date()
  const isPast = new Date(day.date + 'T00:00:00') < new Date(new Date().toDateString())

  async function handleSave() {
    if (!user || saving) return
    setSaving(true)
    try {
      await onSave(day.date, {
        content: content || null,
        is_available: isAvailable,
        is_meeting_day: isMeetingDay,
      })
      setDirty(false)
    } catch (e) {
      console.error('Failed to save:', e)
    }
    setSaving(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up rounded-t-3xl pb-safe-bottom"
        style={{
          backgroundColor: 'var(--color-warm-bg-card)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          boxShadow: '0 -4px 24px rgba(44, 24, 16, 0.08)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        </div>

        <div className="px-6 pb-8">
          {/* Date header */}
          <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
            {dateLabel}
          </h3>

          {/* 伴侣的今日内容（只读展示） */}
          {day.partnerEntry?.content && (
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(194, 120, 92, 0.06)', border: '1px solid rgba(194, 120, 92, 0.12)' }}>
              <p className="font-ui text-[10px] mb-1" style={{ color: 'var(--color-rose-warm)' }}>
                {user?.partner_id ? '伴侣说' : 'TA'}
              </p>
              <p className="font-body text-sm" style={{ color: 'var(--color-ink-soft)' }}>
                {day.partnerEntry.content}
              </p>
            </div>
          )}

          {/* 我的编辑区 */}
          {isPast && !isFuture && (
            <p className="font-ui text-[10px] mb-2" style={{ color: 'var(--color-ink-muted)' }}>
              过去的日子，内容仅供参考
            </p>
          )}

          <div className="space-y-4">
            {/* Content */}
            <div>
              <label className="font-ui text-xs font-medium block mb-1.5" style={{ color: 'var(--color-ink-soft)' }}>
                {isFuture ? '我打算做什么' : '今天做了什么'}
              </label>
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); setDirty(true) }}
                placeholder={isFuture ? '写写今天的计划…' : '写写今天做了什么…'}
                className="input-warm resize-none"
                rows={3}
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="font-ui text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  🌿 这天有空
                </span>
                <div
                  onClick={() => { setIsAvailable(!isAvailable); setDirty(true) }}
                  className="w-10 h-6 rounded-full relative transition-all duration-200"
                  style={{
                    backgroundColor: isAvailable ? 'var(--color-sage)' : 'var(--color-warm-border)',
                  }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${isAvailable ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="font-ui text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  ★ 见面日
                </span>
                <div
                  onClick={() => { setIsMeetingDay(!isMeetingDay); setDirty(true) }}
                  className="w-10 h-6 rounded-full relative transition-all duration-200"
                  style={{
                    backgroundColor: isMeetingDay ? 'var(--color-terracotta)' : 'var(--color-warm-border)',
                  }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${isMeetingDay ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="btn-primary flex-1 text-sm"
              >
                {saving ? '保存中…' : '保存'}
              </button>

              {isMeetingDay && onViewMeeting && (
                <button
                  onClick={() => { onClose(); onViewMeeting(day.date) }}
                  className="btn-secondary flex-1 text-sm"
                >
                  查看规划
                </button>
              )}
            </div>

            {(!user?.partner_id) && (
              <p className="font-ui text-[10px] text-center" style={{ color: 'var(--color-ink-muted)' }}>
                关联伴侣后可查看对方的日历
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
