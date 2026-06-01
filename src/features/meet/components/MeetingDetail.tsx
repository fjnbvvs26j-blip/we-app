import type { MeetingPlan } from '../meet.types'
import TimelineView from './TimelineView'

type Props = {
  plan: MeetingPlan
  onEdit: () => void
  onDelete: () => void
  onSuggest: () => void
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '待确定'
  const d = new Date(dateStr)
  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDay}`
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

type InfoCardProps = {
  icon: string
  title: string
  children: React.ReactNode
}

function InfoCard({ icon, title, children }: InfoCardProps) {
  return (
    <div className="card-warm !rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <h4 className="font-ui text-xs font-semibold tracking-[0.05em]" style={{ color: 'var(--color-ink-soft)' }}>
          {title}
        </h4>
      </div>
      <div className="font-body text-sm" style={{ color: 'var(--color-ink)' }}>
        {children}
      </div>
    </div>
  )
}

export default function MeetingDetail({ plan, onEdit, onDelete, onSuggest }: Props) {
  const isEmpty = !plan.start_time && !plan.end_time && !plan.from_city && !plan.destination &&
    !plan.location && !plan.hotel && !plan.transport && !plan.budget && plan.tasks.length === 0

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="text-center pb-2">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
          {formatDate(plan.meet_date)}
        </h2>
        {plan.meet_date && (
          <p className="font-ui text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
            还有 <span className="font-bold" style={{ color: 'var(--color-terracotta)' }}>{daysUntil(plan.meet_date)}</span> 天
          </p>
        )}
        {plan.status && (
          <span className={`inline-block mt-1 font-ui text-[10px] px-2.5 py-0.5 rounded-full ${
            plan.status === 'confirmed' ? 'text-green-700 bg-green-50' :
            plan.status === 'planning' ? 'text-yellow-700 bg-yellow-50' :
            plan.status === 'completed' ? 'text-blue-700 bg-blue-50' :
            'text-gray-500 bg-gray-50'
          }`}>
            {plan.status === 'confirmed' ? '已确认' : plan.status === 'planning' ? '规划中' :
             plan.status === 'completed' ? '已完成' : '已取消'}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="card-warm !rounded-xl p-8 text-center">
          <span className="text-3xl block mb-3">📋</span>
          <p className="font-display text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
            还没有填写见面规划
          </p>
          <p className="font-ui text-[11px]" style={{ color: 'var(--color-ink-muted)' }}>
            点击编辑开始规划吧
          </p>
        </div>
      ) : (
        <>
          {/* Time */}
          {(plan.start_time || plan.end_time || plan.total_hours) && (
            <InfoCard icon="⏰" title="时间">
              <div className="space-y-1">
                {(plan.start_time || plan.end_time) && (
                  <p>{plan.start_time || '?'} → {plan.end_time || '?'}</p>
                )}
                {plan.total_hours && <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>共 {plan.total_hours}h</p>}
                {(plan.study_hours || plan.date_hours) && (
                  <div className="flex gap-3 mt-1">
                    {plan.study_hours ? <span className="font-ui text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(107, 143, 113, 0.1)', color: 'var(--color-sage)' }}>学习 {plan.study_hours}h</span> : null}
                    {plan.date_hours ? <span className="font-ui text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(194, 120, 92, 0.1)', color: 'var(--color-rose-warm)' }}>约会 {plan.date_hours}h</span> : null}
                  </div>
                )}
              </div>
            </InfoCard>
          )}

          {/* Transport */}
          {(plan.from_city || plan.destination || plan.transport) && (
            <InfoCard icon="🚄" title="出行">
              <div className="space-y-1">
                {plan.from_city && plan.destination && (
                  <p>{plan.from_city} → {plan.destination}</p>
                )}
                {plan.transport && (
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>{plan.transport}</p>
                )}
              </div>
            </InfoCard>
          )}

          {/* Location & Hotel */}
          {(plan.location || plan.hotel) && (
            <InfoCard icon="📍" title="地点 & 住宿">
              <div className="space-y-1">
                {plan.location && <p>{plan.location}</p>}
                {plan.hotel && <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>🏨 {plan.hotel}</p>}
                {plan.budget && <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>💰 预算 ¥{plan.budget}</p>}
              </div>
            </InfoCard>
          )}

          {/* Itinerary */}
          {plan.tasks.length > 0 && (
            <div className="card-warm !rounded-xl p-4">
              <h4 className="font-ui text-xs font-semibold tracking-[0.05em] mb-3" style={{ color: 'var(--color-ink-soft)' }}>
                📋 行程
              </h4>
              <TimelineView tasks={plan.tasks} />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 pb-4">
        <button onClick={onEdit} className="btn-primary flex-1 text-sm">
          编辑规划
        </button>
        <button onClick={onSuggest} className="btn-secondary flex-1 text-sm">
          🤖 AI 建议
        </button>
        {plan.status !== 'completed' && (
          <button
            onClick={onDelete}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  )
}
