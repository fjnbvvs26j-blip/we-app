import { useState } from 'react'
import type { MeetingPlan, MeetTask, MeetTaskInput } from '../meet.types'

type Props = {
  plan: Partial<MeetingPlan> & { meet_date: string }
  onSave: (plan: Partial<MeetingPlan> & { meet_date: string }) => Promise<void>
  onCancel: () => void
}

export default function MeetingEditor({ plan, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    start_time: plan.start_time || '',
    end_time: plan.end_time || '',
    total_hours: plan.total_hours || '',
    study_hours: plan.study_hours || '',
    date_hours: plan.date_hours || '',
    from_city: plan.from_city || '',
    destination: plan.destination || '',
    location: plan.location || '',
    hotel: plan.hotel || '',
    transport: plan.transport || '',
    budget: plan.budget || '',
    status: plan.status || 'planning' as const,
  })
  const [tasks, setTasks] = useState<MeetTaskInput[]>(
    (plan.tasks || []).map(t => ({
      task_type: t.task_type,
      title: t.title,
      description: t.description,
      duration_minutes: t.duration_minutes,
      sort_order: t.sort_order || 0,
    }))
  )
  const [newTask, setNewTask] = useState<MeetTaskInput>({
    task_type: 'date',
    title: '',
    description: '',
    duration_minutes: 60,
    sort_order: tasks.length,
  })
  const [saving, setSaving] = useState(false)

  function updateForm(key: string, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addTask() {
    if (!newTask.title.trim()) return
    setTasks(prev => [...prev, { ...newTask, sort_order: prev.length }])
    setNewTask({ task_type: 'date', title: '', description: '', duration_minutes: 60, sort_order: tasks.length + 1 })
  }

  function removeTask(index: number) {
    setTasks(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({
        ...plan,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        total_hours: form.total_hours ? Number(form.total_hours) : null,
        study_hours: form.study_hours ? Number(form.study_hours) : null,
        date_hours: form.date_hours ? Number(form.date_hours) : null,
        from_city: form.from_city || null,
        destination: form.destination || null,
        location: form.location || null,
        hotel: form.hotel || null,
        transport: form.transport || null,
        budget: form.budget ? Number(form.budget) : null,
        status: form.status,
        tasks,
      })
    } catch (e) {
      console.error('Failed to save plan:', e)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ⏰ 时间 */}
      <section>
        <h3 className="font-ui text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-ink-soft)' }}>
          <span>⏰</span> 时间
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>开始</label>
            <input type="time" value={form.start_time} onChange={e => updateForm('start_time', e.target.value)} className="input-warm !py-2" />
          </div>
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>结束</label>
            <input type="time" value={form.end_time} onChange={e => updateForm('end_time', e.target.value)} className="input-warm !py-2" />
          </div>
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>总时长 (h)</label>
            <input type="number" min="1" max="24" value={form.total_hours} onChange={e => updateForm('total_hours', e.target.value)} className="input-warm !py-2" placeholder="8" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>学习(h)</label>
              <input type="number" min="0" max="24" value={form.study_hours} onChange={e => updateForm('study_hours', e.target.value)} className="input-warm !py-2" placeholder="4" />
            </div>
            <div>
              <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>约会(h)</label>
              <input type="number" min="0" max="24" value={form.date_hours} onChange={e => updateForm('date_hours', e.target.value)} className="input-warm !py-2" placeholder="4" />
            </div>
          </div>
        </div>
      </section>

      {/* 🚄 出行 */}
      <section>
        <h3 className="font-ui text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-ink-soft)' }}>
          <span>🚄</span> 出行
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>出发城市</label>
            <input type="text" value={form.from_city} onChange={e => updateForm('from_city', e.target.value)} className="input-warm !py-2" placeholder="北京" />
          </div>
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>目的地</label>
            <input type="text" value={form.destination} onChange={e => updateForm('destination', e.target.value)} className="input-warm !py-2" placeholder="上海" />
          </div>
        </div>
        <div className="mt-3">
          <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>交通方式</label>
          <input type="text" value={form.transport} onChange={e => updateForm('transport', e.target.value)} className="input-warm !py-2" placeholder="高铁 G123 次" />
        </div>
      </section>

      {/* 📍 地点 & 住宿 */}
      <section>
        <h3 className="font-ui text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-ink-soft)' }}>
          <span>📍</span> 地点 & 住宿
        </h3>
        <div className="space-y-3">
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>见面地点</label>
            <input type="text" value={form.location} onChange={e => updateForm('location', e.target.value)} className="input-warm !py-2" placeholder="上海图书馆 / 外滩" />
          </div>
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>酒店</label>
            <input type="text" value={form.hotel} onChange={e => updateForm('hotel', e.target.value)} className="input-warm !py-2" placeholder="XX 酒店 大床房" />
          </div>
          <div>
            <label className="font-ui text-[10px] block mb-1" style={{ color: 'var(--color-ink-muted)' }}>预算 (¥)</label>
            <input type="number" min="0" value={form.budget} onChange={e => updateForm('budget', e.target.value)} className="input-warm !py-2" placeholder="500" />
          </div>
        </div>
      </section>

      {/* 📋 行程 */}
      <section>
        <h3 className="font-ui text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-ink-soft)' }}>
          <span>📋</span> 行程安排
        </h3>

        {/* Task list */}
        {tasks.length > 0 && (
          <div className="space-y-2 mb-3">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ backgroundColor: 'rgba(232, 221, 208, 0.3)' }}>
                <span className="text-sm">
                  {task.task_type === 'study' ? '📚' : task.task_type === 'date' ? '💑' : '📌'}
                </span>
                <span className="flex-1 font-ui text-xs" style={{ color: 'var(--color-ink)' }}>{task.title}</span>
                {task.duration_minutes && (
                  <span className="font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>{task.duration_minutes}min</span>
                )}
                <button onClick={() => removeTask(i)} className="text-[11px] px-1.5" style={{ color: 'var(--color-ink-muted)' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Add task */}
        <div className="flex items-center gap-2">
          <select
            value={newTask.task_type}
            onChange={e => setNewTask(prev => ({ ...prev, task_type: e.target.value as 'study' | 'date' | 'other' }))}
            className="input-warm !py-2 !w-auto !min-w-[60px]"
          >
            <option value="study">📚</option>
            <option value="date">💑</option>
            <option value="other">📌</option>
          </select>
          <input
            type="text"
            value={newTask.title}
            onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            placeholder="活动名称"
            className="input-warm !py-2 flex-1"
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <input
            type="number"
            value={newTask.duration_minutes || ''}
            onChange={e => setNewTask(prev => ({ ...prev, duration_minutes: Number(e.target.value) || 0 }))}
            placeholder="分钟"
            className="input-warm !py-2 !w-[70px]"
          />
          <button
            onClick={addTask}
            className="w-9 h-9 flex items-center justify-center rounded-xl font-ui text-sm font-medium transition-all"
            style={{ backgroundColor: 'rgba(184, 101, 43, 0.08)', color: 'var(--color-terracotta)' }}
          >
            +
          </button>
        </div>
      </section>

      {/* Status */}
      <section>
        <h3 className="font-ui text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-ink-soft)' }}>
          状态
        </h3>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'planning', label: '规划中' },
            { value: 'confirmed', label: '已确认' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' },
          ] as const).map(s => (
            <button
              key={s.value}
              onClick={() => updateForm('status', s.value)}
              className="font-ui text-xs px-4 py-2 rounded-full transition-all"
              style={{
                backgroundColor: form.status === s.value ? 'rgba(184, 101, 43, 0.08)' : 'rgba(232, 221, 208, 0.3)',
                color: form.status === s.value ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
                border: form.status === s.value ? '1px solid rgba(184, 101, 43, 0.2)' : '1px solid transparent',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 pb-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
          {saving ? '保存中…' : '保存规划'}
        </button>
        <button onClick={onCancel} className="btn-secondary text-sm">
          取消
        </button>
      </div>
    </div>
  )
}
