export type VocabWord = {
  id: string
  word: string
  phonetic: string | null
  meaning: string
  example: string | null
  list_number: number
  frequency: 'high' | 'medium' | 'low' | null
  metadata?: Record<string, any>
}

export type WordProgress = {
  id: string
  user_id: string
  word_id: string
  status: 'new' | 'learning' | 'known' | 'review'
  last_reviewed: string | null
  next_review: string | null
  review_count: number
}

export type WordDetail = VocabWord & {
  progress: {
    status: string
    review_count: number
    times_known: number
    times_unknown: number
    last_reviewed: string | null
    next_review: string | null
  } | null
}

export type DailyStats = {
  todayReviewed: number
  todayNew: number
  streak: number
  goal: number
}

export type WeeklyDay = {
  date: string
  label: string
  reviewed: number
  newWords: number
}

export type WeeklyStats = {
  days: WeeklyDay[]
  totalReviewed: number
  totalNew: number
  resetCount: number
  resetWords: WordDetail[]
  freqBreakdown: { high: number; medium: number; low: number }
  difficultTop20: WordDetail[]
}

export type VocabQuiz = {
  id: string
  from_user_id: string
  to_user_id: string
  quiz_type: 'en_to_cn' | 'cn_to_en' | 'spelling'
  words: { word_id: string; word: string; meaning: string }[]
  status: 'pending' | 'completed' | 'reviewed'
  score: number | null
  total: number | null
  encouragement: string | null
  created_at: string
  completed_at: string | null
}

export type QuizType = 'en_to_cn' | 'cn_to_en' | 'spelling'

export type LearningMode = 'flashcard' | 'quiz_in' | 'quiz_out' | 'search' | 'difficult' | 'weekly'
