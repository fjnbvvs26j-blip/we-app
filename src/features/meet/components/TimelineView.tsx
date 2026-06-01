import type { MeetTask } from '../meet.types'

type Props = {
  tasks: MeetTask[]
  onEdit?: (task: MeetTask) => void
  onDelete?: (taskId: string) => void
}

const TASK_ICONS: Record<string, string> = {
  study: '📚',
  date: '💑',
  other: '📌',
}

export default function TimelineView({ tasks, onEdit, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          还没有添加活动
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 时间线竖线 */}
      <div className="absolute left-[17px] top-2 bottom-2 w-0.5 rounded-full opacity-15"
        style={{ backgroundColor: 'var(--color-ink)' }} />

      <div className="space-y-4">
        {tasks.map((task, i) => (
          <div key={task.id} className="flex items-start gap-3 relative group">
            {/* 时间线节点 */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm z-10"
              style={{
                backgroundColor: 'rgba(184, 101, 43, 0.06)',
                border: '1.5px solid rgba(184, 101, 43, 0.15)',
              }}
            >
              {TASK_ICONS[task.task_type] || '📌'}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-ui text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {task.duration_minutes && (
                    <span className="font-ui text-[10px] whitespace-nowrap" style={{ color: 'var(--color-ink-muted)' }}>
                      {task.duration_minutes}min
                    </span>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-1.5 py-0.5 rounded-full"
                      style={{ color: 'var(--color-ink-muted)' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
