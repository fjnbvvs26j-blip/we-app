import { supabase } from '@/shared/lib/supabase'
import type { VocabWord, VocabQuiz, WordDetail, DailyStats, WeeklyStats, WeeklyDay } from './vocab.types'

// SM-2 间隔: review_count → 天数
const INTERVALS: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
  6: 60,
}

function getNextReview(reviewCount: number, known: boolean): Date {
  const now = new Date()
  if (!known) return new Date(now.getTime() + 4 * 3600000)
  const days = INTERVALS[Math.min(reviewCount + 1, 6)] || 60
  const jitter = Math.floor(Math.random() * 3600000 * 2)
  return new Date(now.getTime() + days * 86400000 + jitter)
}

// ============ 打卡 & 每日目标 (localStorage) ============

const STREAK_KEY = 'we_vocab_streak'
const GOAL_KEY = 'we_vocab_goal'

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function loadStreak(): { days: number; lastDate: string } {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"days":0,"lastDate":""}')
  } catch { return { days: 0, lastDate: '' } }
}

function saveStreak(s: { days: number; lastDate: string }) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(s))
}

function updateStreak() {
  const today = getTodayStr()
  const s = loadStreak()
  if (s.lastDate === today) return // 今天已打过卡

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (s.lastDate === yesterday) {
    s.days += 1
  } else {
    s.days = 1
  }
  s.lastDate = today
  saveStreak(s)
}

export function getDailyGoal(): number {
  try {
    return parseInt(localStorage.getItem(GOAL_KEY) || '20') || 20
  } catch { return 20 }
}

export function setDailyGoal(n: number) {
  localStorage.setItem(GOAL_KEY, String(Math.max(1, Math.min(n, 200))))
}

export const vocabService = {
  async getWordCount() {
    const { count, error } = await supabase
      .from('vocab_words')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count || 0
  },

  async getWords(listNumber?: number, limit = 50) {
    let q = supabase.from('vocab_words').select('*').limit(limit)
    if (listNumber) q = q.eq('list_number', listNumber)
    else q = q.order('list_number', { ascending: true })
    const { data, error } = await q
    if (error) throw error
    return (data || []) as VocabWord[]
  },

  async getNewWords(userId: string, limit = 15) {
    // 只取最近学过的 word_id，避免全量拉取
    const { data: learned } = await supabase
      .from('vocab_progress')
      .select('word_id')
      .eq('user_id', userId)
      .limit(500)

    const learnedIds = (learned || []).map(r => r.word_id)

    // 如果有已学 ID，用 not.in 在服务器端过滤
    let q = supabase.from('vocab_words').select('*').order('list_number', { ascending: true }).limit(limit * 3)
    if (learnedIds.length > 0) {
      q = q.not('id', 'in', `(${learnedIds.join(',')})`)
    }

    const { data, error } = await q
    if (error) throw error

    return ((data || []) as VocabWord[]).filter(w => !learnedIds.includes(w.id)).slice(0, limit)
  },

  async getReviewWords(userId: string, limit = 30) {
    const now = new Date().toISOString()
    const { data: progress, error } = await supabase
      .from('vocab_progress')
      .select('word_id')
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
      .limit(limit)

    if (error) throw error
    if (!progress || progress.length === 0) return []

    const wordIds = progress.map(p => p.word_id)
    const { data: words, error: err2 } = await supabase
      .from('vocab_words')
      .select('*')
      .in('id', wordIds)

    if (err2) throw err2
    return ((words || []) as VocabWord[]).map(w => ({
      id: '',
      word_id: w.id,
      vocab_words: w,
    }))
  },

  async saveProgress(userId: string, wordId: string, known: boolean) {
    const { data: existing } = await supabase
      .from('vocab_progress')
      .select('id, review_count, status, metadata')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single()

    const meta = (existing?.metadata as Record<string, any>) || {}
    const timesKnown = (meta.times_known || 0) + (known ? 1 : 0)
    const timesUnknown = (meta.times_unknown || 0) + (known ? 0 : 1)
    const newMeta = { ...meta, times_known: timesKnown, times_unknown: timesUnknown }

    // 不认识则重置复习进度
    const effectiveCount = known ? (existing?.review_count || 0) : 0
    const nextReview = getNextReview(effectiveCount, known)
    const newCount = known ? effectiveCount + 1 : 0

    if (existing) {
      const { error } = await supabase.from('vocab_progress').update({
        status: known ? (newCount >= 3 ? 'known' : 'learning') : 'learning',
        last_reviewed: new Date().toISOString(),
        next_review: nextReview.toISOString(),
        review_count: newCount,
        metadata: newMeta,
      }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('vocab_progress').insert({
        user_id: userId,
        word_id: wordId,
        status: 'learning',
        last_reviewed: new Date().toISOString(),
        next_review: nextReview.toISOString(),
        review_count: known ? 1 : 0,
        metadata: newMeta,
      })
      if (error) throw error
    }

    // 更新打卡
    updateStreak()
  },

  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('vocab_progress')
      .select('status, next_review')
      .eq('user_id', userId)
      .limit(5000)

    if (error) throw error
    const total = data.length
    const known = data.filter(d => d.status === 'known').length
    const learning = data.length - known
    const now = new Date()
    const due = data.filter(d => d.next_review && new Date(d.next_review) <= now).length

    return { total, known, learning, due }
  },

  async getDailyStats(userId: string): Promise<DailyStats> {
    const today = getTodayStr()
    const todayStart = today + 'T00:00:00+08:00'
    const todayEnd = today + 'T23:59:59+08:00'

    const { count: todayReviewed } = await supabase
      .from('vocab_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_reviewed', todayStart)
      .lte('last_reviewed', todayEnd)

    // 统计今天学了多少新词（首次 review_count > 0 的）
    const { count: todayNew } = await supabase
      .from('vocab_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('review_count', 1)
      .gte('last_reviewed', todayStart)
      .lte('last_reviewed', todayEnd)

    const streak = loadStreak()

    return {
      todayReviewed: todayReviewed || 0,
      todayNew: todayNew || 0,
      streak: streak.days,
      goal: getDailyGoal(),
    }
  },

  async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    // 一次查询拉取近 7 天所有数据，客户端按天分组
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: allProgress, error } = await supabase
      .from('vocab_progress')
      .select('review_count, last_reviewed')
      .eq('user_id', userId)
      .gte('last_reviewed', sevenDaysAgo)
      .limit(2000)

    // 按日期字符串为 key 分组
    const dayMap = new Map<string, { reviewed: number; newWords: number }>()

    if (allProgress) {
      for (const p of allProgress) {
        const dateStr = p.last_reviewed?.slice(0, 10)
        if (!dateStr) continue
        const entry = dayMap.get(dateStr) || { reviewed: 0, newWords: 0 }
        entry.reviewed++
        if (p.review_count === 1) entry.newWords++
        dayMap.set(dateStr, entry)
      }
    }

    // 构建 7 天数组
    const days: WeeklyDay[] = []
    let totalReviewed = 0, totalNew = 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const entry = dayMap.get(dateStr) || { reviewed: 0, newWords: 0 }
      days.push({
        date: dateStr,
        label: i === 0 ? '今天' : dayLabels[d.getDay()],
        reviewed: entry.reviewed,
        newWords: entry.newWords,
      })
      totalReviewed += entry.reviewed
      totalNew += entry.newWords
    }

    return { days, totalReviewed, totalNew }
  },

  // ============ 搜索 ============

  async searchWord(userId: string, query: string): Promise<WordDetail[]> {
    const { data: words, error } = await supabase
      .from('vocab_words')
      .select('*')
      .ilike('word', `${query}%`)
      .limit(20)

    if (error || !words) return []

    const wordIds = words.map(w => w.id)
    const { data: progress } = await supabase
      .from('vocab_progress')
      .select('*')
      .eq('user_id', userId)
      .in('word_id', wordIds)

    const progressMap = new Map((progress || []).map(p => [p.word_id, p]))

    return words.map(w => {
      const p = progressMap.get(w.id)
      const meta = p?.metadata || {}
      return {
        ...w,
        progress: p ? {
          status: p.status,
          review_count: p.review_count,
          times_known: (meta as any)?.times_known || 0,
          times_unknown: (meta as any)?.times_unknown || 0,
          last_reviewed: p.last_reviewed,
          next_review: p.next_review,
        } : null,
      }
    }) as WordDetail[]
  },

  // ============ 易错词 ============

  async getDifficultWords(userId: string, limit = 30): Promise<WordDetail[]> {
    const { data: progress, error } = await supabase
      .from('vocab_progress')
      .select('*')
      .eq('user_id', userId)
      .limit(500)

    if (error || !progress) return []

    // 筛选 metadata.times_unknown >= 2 的词
    const difficult = progress
      .filter(p => {
        const meta = (p.metadata as any) || {}
        return (meta.times_unknown || 0) >= 2
      })
      .sort((a, b) => {
        const ma = (a.metadata as any) || {}
        const mb = (b.metadata as any) || {}
        return (mb.times_unknown || 0) - (ma.times_unknown || 0)
      })
      .slice(0, limit)

    if (difficult.length === 0) return []

    const wordIds = difficult.map(p => p.word_id)
    const { data: words } = await supabase
      .from('vocab_words')
      .select('*')
      .in('id', wordIds)

    const wordMap = new Map((words || []).map(w => [w.id, w]))

    return difficult.map(p => {
      const w = wordMap.get(p.word_id)
      const meta = (p.metadata as any) || {}
      return {
        ...(w || {} as VocabWord),
        progress: {
          status: p.status,
          review_count: p.review_count,
          times_known: meta.times_known || 0,
          times_unknown: meta.times_unknown || 0,
          last_reviewed: p.last_reviewed,
          next_review: p.next_review,
        },
      }
    }) as WordDetail[]
  },

  // ============ 单词列表（按状态） ============

  /** 获取学习中/已掌握的单词，按复习次数排序 */
  async getWordsByStatus(userId: string, status: 'learning' | 'known'): Promise<WordDetail[]> {
    const { data: progress, error } = await supabase
      .from('vocab_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('review_count', { ascending: false })
      .limit(1000)

    if (error || !progress || progress.length === 0) return []

    const wordIds = progress.map(p => p.word_id)
    const { data: words } = await supabase
      .from('vocab_words')
      .select('*')
      .in('id', wordIds)

    const wordMap = new Map((words || []).map(w => [w.id, w]))

    return progress.map(p => {
      const w = wordMap.get(p.word_id)
      const meta = (p.metadata as any) || {}
      return {
        ...(w || {} as VocabWord),
        progress: {
          status: p.status,
          review_count: p.review_count,
          times_known: meta.times_known || 0,
          times_unknown: meta.times_unknown || 0,
          last_reviewed: p.last_reviewed,
          next_review: p.next_review,
        },
      }
    }).filter(Boolean) as WordDetail[]
  },

  /** 获取待复习单词，按 next_review 排序 */
  async getDueWords(userId: string): Promise<WordDetail[]> {
    const now = new Date().toISOString()
    const { data: progress, error } = await supabase
      .from('vocab_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
      .limit(1000)

    if (error || !progress || progress.length === 0) return []

    const wordIds = progress.map(p => p.word_id)
    const { data: words } = await supabase
      .from('vocab_words')
      .select('*')
      .in('id', wordIds)

    const wordMap = new Map((words || []).map(w => [w.id, w]))

    return progress.map(p => {
      const w = wordMap.get(p.word_id)
      const meta = (p.metadata as any) || {}
      return {
        ...(w || {} as VocabWord),
        progress: {
          status: p.status,
          review_count: p.review_count,
          times_known: meta.times_known || 0,
          times_unknown: meta.times_unknown || 0,
          last_reviewed: p.last_reviewed,
          next_review: p.next_review,
        },
      }
    }).filter(Boolean) as WordDetail[]
  },

  /** 获取总词库，按字母排序（所有词页并行 + 单次批量进度查询，仅 2 轮等待） */
  async getAllWordsSorted(userId: string): Promise<WordDetail[]> {
    const pageSize = 1000

    // 第 1 轮：总数 + 第一页
    const [{ count }, firstPage] = await Promise.all([
      supabase.from('vocab_words').select('*', { count: 'exact', head: true }).then(r => r),
      supabase.from('vocab_words').select('*').order('word', { ascending: true }).range(0, pageSize - 1).then(r => r),
    ])
    const total = count || 0
    if (firstPage.error || !firstPage.data || firstPage.data.length === 0) return []

    const allWords: VocabWord[] = [...firstPage.data] as VocabWord[]

    // 第 2 轮：剩余词页并行获取 + 全部进度查询
    const remainingPages = Math.ceil(total / pageSize) - 1
    if (remainingPages > 0) {
      const pagePromises = []
      for (let i = 1; i <= remainingPages; i++) {
        const from = i * pageSize
        const to = from + pageSize - 1
        pagePromises.push(
          supabase.from('vocab_words').select('*').order('word', { ascending: true }).range(from, to).then(r => r)
        )
      }
      const results = await Promise.all(pagePromises)
      for (const r of results) {
        if (r.data && r.data.length > 0) allWords.push(...r.data)
      }
    }

    // 批量拉进度（一次查询覆盖所有词）
    const allWordIds = allWords.map(w => w.id)
    const progressMap = new Map<string, any>()
    // 分批查进度：in 子句最多 ~10000 个元素，安全起见每 2000 个一批
    for (let i = 0; i < allWordIds.length; i += 2000) {
      const batch = allWordIds.slice(i, i + 2000)
      const { data: progress } = await supabase
        .from('vocab_progress')
        .select('*')
        .eq('user_id', userId)
        .in('word_id', batch)
        .then(r => r)
      if (progress) {
        for (const p of progress) progressMap.set(p.word_id, p)
      }
    }

    return allWords.map(w => {
      const p = progressMap.get(w.id)
      const meta = (p?.metadata as any) || {}
      return {
        ...w,
        progress: p ? {
          status: p.status,
          review_count: p.review_count,
          times_known: meta.times_known || 0,
          times_unknown: meta.times_unknown || 0,
          last_reviewed: p.last_reviewed,
          next_review: p.next_review,
        } : null,
      }
    }) as WordDetail[]
  },

  // ============ 互动出题 ============

  async createQuiz(fromUserId: string, toUserId: string, quizType: string, wordIds: string[]) {
    const { data: words } = await supabase
      .from('vocab_words')
      .select('id, word, meaning')
      .in('id', wordIds)

    const { data, error } = await supabase.from('vocab_quizzes').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      quiz_type: quizType,
      words: words || [],
      total: wordIds.length,
    }).select().single()

    if (error) throw error
    return data as VocabQuiz
  },

  async getPendingQuizzes(userId: string) {
    const { data } = await supabase
      .from('vocab_quizzes')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    return (data || []) as VocabQuiz[]
  },

  async getOutgoingQuizzes(userId: string) {
    const { data } = await supabase
      .from('vocab_quizzes')
      .select('*')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })
    return (data || []) as VocabQuiz[]
  },

  async submitQuiz(quizId: string, score: number) {
    const { error } = await supabase
      .from('vocab_quizzes')
      .update({ status: 'completed', score, completed_at: new Date().toISOString() })
      .eq('id', quizId)
    if (error) throw error
  },

  async reviewQuiz(quizId: string, encouragement: string) {
    const { error } = await supabase
      .from('vocab_quizzes')
      .update({ status: 'reviewed', encouragement })
      .eq('id', quizId)
    if (error) throw error
  },
}
