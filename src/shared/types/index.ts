export type Profile = {
  id: string
  nickname: string
  avatar_url: string | null
  target_school: string | null
  partner_id: string | null
  created_at: string
}

export type UserStatus = 'studying' | 'resting' | 'missing_you' | 'free_to_chat' | 'custom'

export type Status = {
  id: string
  user_id: string
  status: UserStatus
  custom_text: string | null
  updated_at: string
}
