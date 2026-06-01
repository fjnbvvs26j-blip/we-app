// ============ 日历条目 ============

export type CalendarEntry = {
  id: string
  user_id: string
  date: string        // YYYY-MM-DD
  content: string | null
  is_available: boolean
  is_meeting_day: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** 用于展示的带星期信息的日历格子 */
export type CalendarDay = {
  date: string
  dayOfMonth: number
  dayOfWeek: number     // 0=Sun, 6=Sat
  isCurrentMonth: boolean
  isToday: boolean
  // 双方数据
  myEntry: CalendarEntry | null
  partnerEntry: CalendarEntry | null
}

export type CalendarMonth = {
  year: number
  month: number         // 1-12
  days: CalendarDay[]
}

// ============ 见面规划 ============

export type MeetingPlan = {
  id: string
  meet_date: string | null
  start_time: string | null
  end_time: string | null
  total_hours: number | null
  study_hours: number | null
  date_hours: number | null
  from_city: string | null
  destination: string | null
  location: string | null
  hotel: string | null
  transport: string | null
  budget: number | null
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled'
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  tasks: MeetTask[]
}

export type MeetTask = {
  id: string
  plan_id: string
  task_type: 'study' | 'date' | 'other'
  title: string
  description: string | null
  duration_minutes: number | null
  sort_order: number
  created_at: string
}

export type MeetTaskInput = {
  task_type: MeetTask['task_type']
  title: string
  description?: string
  duration_minutes?: number
  sort_order?: number
}

// ============ 伴侣日历 ============

export type PartnerCalendarData = {
  myEntries: CalendarEntry[]
  partnerEntries: CalendarEntry[]
}

// ============ AI 建议 ============

export type Suggestion = {
  id: string
  type: 'time_split' | 'date_idea' | 'transport' | 'packing' | 'budget' | 'itinerary'
  title: string
  description: string
  details: string[]
  actionable?: boolean
  apply?: Record<string, unknown>  // 可应用的字段
}
