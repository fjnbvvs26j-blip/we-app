export type StatusOption = 'studying' | 'resting' | 'missing_you' | 'free_to_chat' | 'custom'

export type MyStatus = {
  status: StatusOption
  custom_text: string | null
  updated_at: string
} | null  // null = never set

export type PartnerStatus = {
  status: StatusOption
  custom_text: string | null
  updated_at: string
  partner_nickname: string
} | null

export type CountdownData = {
  daysUntil: number
  meetDate: string
  meetStatus: 'planning' | 'confirmed' | 'completed' | 'cancelled'
  fromCity: string | null
} | null  // null = no meeting planned

export type QuickStatsData = {
  todayReviewed: number
  todayNew: number
  streak: number
  goal: number
  knownTotal: number
  learningTotal: number
}

export type PartnerInfo = {
  nickname: string
  target_school: string | null
  avatar_url: string | null
} | null
