import { supabase } from '@/shared/lib/supabase'
import type { CalendarEntry, MeetingPlan, MeetTask, MeetTaskInput, PartnerCalendarData } from './meet.types'

export const meetService = {

  // ============ 日历条目 CRUD ============

  /** 按月获取自己和伴侣的日历条目 */
  async getMonthEntries(userId: string, partnerId: string | null, year: number, month: number): Promise<PartnerCalendarData> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const userIds = partnerId ? [userId, partnerId] : [userId]

    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*')
      .in('user_id', userIds)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error

    const entries = (data || []) as CalendarEntry[]
    return {
      myEntries: entries.filter(e => e.user_id === userId),
      partnerEntries: entries.filter(e => e.user_id !== userId),
    }
  },

  /** 保存/更新单日条目（upsert） */
  async upsertDayEntry(userId: string, date: string, fields: {
    content?: string | null
    is_available?: boolean
    is_meeting_day?: boolean
  }): Promise<CalendarEntry> {
    const { data, error } = await supabase
      .from('calendar_entries')
      .upsert({
        user_id: userId,
        date,
        content: fields.content ?? null,
        is_available: fields.is_available ?? false,
        is_meeting_day: fields.is_meeting_day ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) throw error
    return data as CalendarEntry
  },

  /** 获取某天的条目 */
  async getDayEntry(userId: string, date: string): Promise<CalendarEntry | null> {
    const { data, error } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (error) throw error
    return data as CalendarEntry | null
  },

  /** 删除单日条目 */
  async deleteDayEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_entries')
      .delete()
      .eq('id', entryId)

    if (error) throw error
  },

  // ============ 见面规划 CRUD ============

  /** 获取某个日期的见面计划 */
  async getMeetingByDate(date: string): Promise<MeetingPlan | null> {
    const { data, error } = await supabase
      .from('meet_plans')
      .select('*')
      .eq('meet_date', date)
      .maybeSingle()

    if (error || !data) return null

    const plan = data as MeetingPlan
    plan.tasks = await this.getPlanTasks(plan.id)
    return plan
  },

  /** 获取所有见面计划 */
  async getAllMeetings(): Promise<MeetingPlan[]> {
    const { data, error } = await supabase
      .from('meet_plans')
      .select('*')
      .order('meet_date', { ascending: true })

    if (error) throw error
    return (data || []) as MeetingPlan[]
  },

  /** 创建或更新见面计划 */
  async upsertMeetingPlan(plan: Partial<MeetingPlan> & { meet_date: string }): Promise<MeetingPlan> {
    const now = new Date().toISOString()
    const payload = {
      meet_date: plan.meet_date,
      start_time: plan.start_time ?? null,
      end_time: plan.end_time ?? null,
      total_hours: plan.total_hours ?? null,
      study_hours: plan.study_hours ?? null,
      date_hours: plan.date_hours ?? null,
      from_city: plan.from_city ?? null,
      destination: plan.destination ?? null,
      location: plan.location ?? null,
      hotel: plan.hotel ?? null,
      transport: plan.transport ?? null,
      budget: plan.budget ?? null,
      status: plan.status ?? 'planning',
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('meet_plans')
      .upsert(payload, { onConflict: 'meet_date' })
      .select()
      .single()

    if (error) throw error

    const result = data as MeetingPlan
    result.tasks = plan.tasks || []
    return result
  },

  /** 更新已有见面计划 */
  async updateMeetingPlan(id: string, plan: Partial<MeetingPlan>): Promise<MeetingPlan> {
    const { data, error } = await supabase
      .from('meet_plans')
      .update({ ...plan, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const result = data as MeetingPlan
    result.tasks = await this.getPlanTasks(id)
    return result
  },

  /** 删除见面计划 */
  async deleteMeetingPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('meet_plans')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ============ 活动（tasks）CRUD ============

  /** 获取见面计划的所有活动 */
  async getPlanTasks(planId: string): Promise<MeetTask[]> {
    const { data, error } = await supabase
      .from('meet_tasks')
      .select('*')
      .eq('plan_id', planId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data || []) as MeetTask[]
  },

  /** 添加活动 */
  async addTask(planId: string, input: MeetTaskInput): Promise<MeetTask> {
    const { data, error } = await supabase
      .from('meet_tasks')
      .insert({
        plan_id: planId,
        task_type: input.task_type,
        title: input.title,
        description: input.description ?? null,
        duration_minutes: input.duration_minutes ?? null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    return data as MeetTask
  },

  /** 更新活动 */
  async updateTask(taskId: string, input: Partial<MeetTaskInput>): Promise<MeetTask> {
    const { data, error } = await supabase
      .from('meet_tasks')
      .update(input)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return data as MeetTask
  },

  /** 删除活动 */
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('meet_tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  },

  /** 批量更新活动顺序 */
  async reorderTasks(tasks: { id: string; sort_order: number }[]): Promise<void> {
    for (const t of tasks) {
      await supabase
        .from('meet_tasks')
        .update({ sort_order: t.sort_order })
        .eq('id', t.id)
    }
  },
}
