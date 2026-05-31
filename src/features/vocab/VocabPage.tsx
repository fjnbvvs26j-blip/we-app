import { useState, useEffect, useRef, Fragment } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { vocabService, getDailyGoal, setDailyGoal } from './vocab.service'
import FlashCard from './FlashCard'
import type { VocabWord, WordDetail, DailyStats, WeeklyStats, LearningMode } from './vocab.types'

function renderMeaning(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold" style={{ color: 'var(--color-terracotta)' }}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

const ROUND_KEY = 'we_vocab_round_size'

function getRoundSize(): number {
  try { return parseInt(localStorage.getItem(ROUND_KEY) || '10') || 10 } catch { return 10 }
}
function setRoundSize(n: number) {
  localStorage.setItem(ROUND_KEY, String(Math.max(3, Math.min(n, 50))))
}

// ─── 统计数字卡片（可点击） ───
function StatCard({ value, label, color, onClick }: { value: number | string; label: string; color: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all hover:-translate-y-0.5 duration-200 active:scale-95"
      style={{ backgroundColor: 'rgba(255,255,255,0.5)', cursor: onClick ? 'pointer' : 'default' }}
    >
      <span className="font-display text-xl md:text-2xl font-semibold tracking-tight" style={{ color }}>
        {value}
      </span>
      <span className="font-ui text-[10px] mt-0.5 tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
        {label}
      </span>
    </button>
  )
}

// ─── 进度环 ───
function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(pct, 100) / 100)
  const color = pct >= 100 ? 'var(--color-sage)' : 'var(--color-terracotta)'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-warm-border)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <span className="font-ui text-[9px] font-bold" style={{ color: 'var(--color-ink-soft)' }}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}

// ─── 装饰分隔线 ───
function Divider() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#E8DDD0] to-transparent" />
    </div>
  )
}

// ══════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════
export default function VocabPage() {
  const { user, signOut } = useAuth()
  const [mode, setMode] = useState<LearningMode>('flashcard')
  const [words, setWords] = useState<VocabWord[]>([])
  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ total: 0, known: 0, learning: 0, due: 0, vocabTotal: 0 })
  const [daily, setDaily] = useState<DailyStats>({ todayReviewed: 0, todayNew: 0, streak: 0, goal: 20 })
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [roundComplete, setRoundComplete] = useState(false)
  const [roundSize, setRoundSizeState] = useState(getRoundSize)

  // 搜索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WordDetail[]>([])
  const [searching, setSearching] = useState(false)

  // 易错词
  const [difficultWords, setDifficultWords] = useState<WordDetail[]>([])
  const [difficultLoaded, setDifficultLoaded] = useState(false)

  // 周报
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null)
  const [weeklyLoaded, setWeeklyLoaded] = useState(false)

  // 目标编辑
  const [editingGoal, setEditingGoal] = useState(false)

  // 统计卡片查看单词列表
  const [statList, setStatList] = useState<{ title: string; words: WordDetail[]; loading: boolean } | null>(null)
  const [consultWord, setConsultWord] = useState<WordDetail | null>(null)
  const [statSearch, setStatSearch] = useState('')

  // 请求去重：30s 内不重复查询同一接口
  const lastFetch = useRef(new Map<string, number>())
  function dedup(key: string, minInterval = 30000): boolean {
    const now = Date.now()
    if (now - (lastFetch.current.get(key) || 0) < minInterval) return false
    lastFetch.current.set(key, now)
    return true
  }

  // 包装带去重的 stats 刷新
  function refreshStats() {
    if (!user) return
    if (dedup('stats')) {
      vocabService.getStats(user.id).then(st => {
        setStats(prev => ({ ...prev, total: st.total, known: st.known, learning: st.learning, due: st.due }))
      }).catch(() => {})
    }
  }
  function refreshDailyStats() {
    if (!user || !dedup('daily')) return
    loadDailyStats()
  }

  useEffect(() => {
    if (user) { loadWords(); loadDailyStats() }
  }, [user])

  // 页面可见时每 30s 自动刷新 stats
  useEffect(() => {
    if (!user) return
    let timer: ReturnType<typeof setInterval>
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshStats()
        refreshDailyStats()
        timer = setInterval(() => {
          refreshStats()
          refreshDailyStats()
        }, 30000)
      } else {
        clearInterval(timer)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    timer = setInterval(refreshStats, 30000)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user])

  async function loadWords() {
    if (!user) return
    setError('')
    setRoundComplete(false)
    try {
      const size = getRoundSize()
      const review = await vocabService.getReviewWords(user.id, size)
      const reviewWords = review.map(r => r.vocab_words)

      let allWords = [...reviewWords]
      if (allWords.length < size) {
        const need = size - allWords.length
        const newWords = await vocabService.getNewWords(user.id, need)
        allWords = [...allWords, ...newWords]
      }

      const st = await vocabService.getStats(user.id)
      const wordCount = await vocabService.getWordCount()

      setWords(allWords)
      setStats({ total: st.total, known: st.known, learning: st.learning, due: st.due, vocabTotal: wordCount })
      setIndex(0)
      setReady(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setReady(true)
    }
  }

  async function loadDailyStats() {
    if (!user) return
    try {
      const ds = await vocabService.getDailyStats(user.id)
      setDaily(ds)
    } catch { /* 静默 */ }
  }

  function handleResult(known: boolean) {
    if (!user || words.length === 0) return
    const word = words[index]
    // 火后不理：保存进度不阻塞翻卡
    vocabService.saveProgress(user!.id, word.id, known).catch(() => {})

    if (index < words.length - 1) {
      setIndex(i => i + 1)
    } else {
      setRoundComplete(true)
      loadDailyStats()
      vocabService.getStats(user!.id).then(st => {
        setStats(prev => ({ ...prev, total: st.total, known: st.known, learning: st.learning, due: st.due }))
      }).catch(() => {})
    }
  }

  async function doSearch(q: string) {
    setSearchQuery(q)
    if (!user || q.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const results = await vocabService.searchWord(user.id, q.trim())
      setSearchResults(results)
    } catch { /* 静默 */ }
    setSearching(false)
  }

  async function loadDifficultWords() {
    if (!user || difficultLoaded) return
    try {
      const dw = await vocabService.getDifficultWords(user.id, 30)
      setDifficultWords(dw)
    } catch { /* 静默 */ }
    setDifficultLoaded(true)
  }

  async function loadWeeklyStats() {
    if (!user) return
    try {
      const ws = await vocabService.getWeeklyStats(user.id)
      setWeekly(ws)
    } catch { /* 静默 */ }
    setWeeklyLoaded(true)
  }

  function handleChangeRoundSize() {
    const n = parseInt(prompt(`每轮背几个单词？（3-50）`, String(getRoundSize())) || '') || getRoundSize()
    const clamped = Math.max(3, Math.min(n, 50))
    setRoundSize(clamped)
    setRoundSizeState(clamped)
    loadWords()
  }

  async function handleStatClick(title: string, type: 'learning' | 'known' | 'due' | 'all') {
    if (!user) return
    setStatSearch('')
    setStatList({ title, words: [], loading: true })
    try {
      let words: WordDetail[] = []
      if (type === 'all') words = await vocabService.getAllWordsSorted(user.id)
      else if (type === 'learning') words = await vocabService.getWordsByStatus(user.id, 'learning')
      else if (type === 'known') words = await vocabService.getWordsByStatus(user.id, 'known')
      else words = await vocabService.getDueWords(user.id)
      setStatList({ title, words, loading: false })
    } catch {
      setStatList({ title, words: [], loading: false })
    }
  }

  const tabs: { key: LearningMode; label: string }[] = [
    { key: 'flashcard', label: '背单词' },
    { key: 'weekly', label: '周报' },
    { key: 'search', label: '搜索' },
    { key: 'difficult', label: '易错' },
    { key: 'quiz_in', label: 'TA题' },
    { key: 'quiz_out', label: '我出' },
  ]

  const goalPct = daily.goal > 0 ? Math.min(100, Math.round((daily.todayReviewed / daily.goal) * 100)) : 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
          <span className="tracking-wide">单词</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            {user?.nickname}
          </span>
          <button
            onClick={signOut}
            className="font-ui text-[11px] px-3 py-1.5 rounded-full transition-all"
            style={{
              color: 'var(--color-ink-muted)',
              backgroundColor: 'rgba(232, 221, 208, 0.4)',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(232, 221, 208, 0.8)')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(232, 221, 208, 0.4)')}
          >
            退出
          </button>
        </div>
      </header>

      <div className="px-5 pb-8">
        {/* ─── 统计卡片行 ─── */}
        <div className="card-warm !rounded-2xl p-4 stagger">
          <div className="flex gap-2">
            <StatCard value={stats.learning} label="学习中" color="var(--color-terracotta)" onClick={() => handleStatClick('学习中', 'learning')} />
            <StatCard value={stats.due} label="待复习" color="var(--color-terracotta-light)" onClick={() => handleStatClick('待复习', 'due')} />
            <StatCard value={stats.known} label="已掌握" color="var(--color-sage)" onClick={() => handleStatClick('已掌握', 'known')} />
            <StatCard value={stats.vocabTotal} label="总词库" color="var(--color-ink-muted)" onClick={() => handleStatClick('总词库', 'all')} />
          </div>

          <Divider />

          {/* 打卡 + 每日目标 */}
          <div className="flex items-center justify-center gap-5 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🔥</span>
              <span className="font-display font-semibold text-base" style={{ color: 'var(--color-ink-soft)' }}>
                {daily.streak}
              </span>
              <span className="font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>天</span>
            </div>

            <div className="w-px h-6" style={{ backgroundColor: 'var(--color-warm-border)' }} />

            <div className="relative">
              <button
                onClick={() => setEditingGoal(!editingGoal)}
                className="flex items-center gap-1 group"
              >
                <span className="font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>今日</span>
                <span className="font-display font-semibold text-base"
                  style={{ color: goalPct >= 100 ? 'var(--color-sage)' : 'var(--color-ink-soft)' }}>
                  {daily.todayReviewed}
                </span>
                <span className="font-ui text-[11px]" style={{ color: 'var(--color-warm-border)' }}>/</span>
                <span className="font-display font-semibold text-base group-hover:opacity-60 transition-opacity" style={{ color: 'var(--color-ink-soft)' }}>
                  {daily.goal}
                  <span className="font-ui text-[9px] font-normal opacity-0 group-hover:opacity-50 ml-0.5" style={{ color: 'var(--color-ink-muted)' }}>✎</span>
                </span>
              </button>

              {editingGoal && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 card-warm !rounded-2xl p-4 z-10 shadow-lg animate-scale-in"
                  style={{ backgroundColor: 'var(--color-warm-bg-card)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setDaily(d => ({ ...d, goal: Math.max(1, d.goal - 5) }))}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg active:scale-90 transition-all"
                      style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-soft)' }}
                    >−</button>
                    <span className="font-display text-xl font-bold min-w-[3ch] text-center" style={{ color: 'var(--color-ink)' }}>
                      {daily.goal}
                    </span>
                    <button
                      onClick={() => setDaily(d => ({ ...d, goal: Math.min(200, d.goal + 5) }))}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg active:scale-90 transition-all"
                      style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink-soft)' }}
                    >+</button>
                  </div>
                  <div className="flex gap-1.5">
                    {[10, 20, 30, 50].map(n => (
                      <button
                        key={n}
                        onClick={() => { setDaily(d => ({ ...d, goal: n })); setDailyGoal(n); setEditingGoal(false); loadDailyStats() }}
                        className={`flex-1 py-1.5 rounded-lg font-ui text-xs font-medium transition-all active:scale-95 ${
                          daily.goal === n ? '' : ''
                        }`}
                        style={{
                          backgroundColor: daily.goal === n ? 'var(--color-terracotta)' : 'var(--color-paper)',
                          color: daily.goal === n ? 'white' : 'var(--color-ink-muted)',
                        }}
                      >{n}</button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setDailyGoal(daily.goal); setEditingGoal(false); loadDailyStats() }}
                    className="w-full mt-2 py-1.5 rounded-lg font-ui text-xs font-medium transition-all"
                    style={{ backgroundColor: 'var(--color-sage)', color: 'white' }}
                  >确定</button>
                </div>
              )}
            </div>

            <ProgressRing pct={goalPct} />
          </div>
        </div>

        {/* ─── Tab 切换 ─── */}
        <div className="mt-4">
          <div className="flex gap-1 p-1 rounded-xl"
            style={{
              backgroundColor: 'rgba(232, 221, 208, 0.3)',
              border: '1px solid rgba(232, 221, 208, 0.5)',
            }}
          >
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  setMode(t.key)
                  if (t.key === 'flashcard') { refreshStats(); refreshDailyStats() }
                  if (t.key === 'difficult') loadDifficultWords()
                  if (t.key === 'weekly') loadWeeklyStats()
                }}
                className={`flex-1 min-w-0 py-2 rounded-[10px] font-ui text-sm font-medium transition-all duration-200 ${
                  mode === t.key ? '' : ''
                }`}
                style={
                  mode === t.key
                    ? {
                        color: 'var(--color-ink)',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 3px rgba(44,24,16,0.06)',
                      }
                    : { color: 'var(--color-ink-muted)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── 内容区 ─── */}
        <div className="mt-5">
          {/* ========== 背单词 ========== */}
          {mode === 'flashcard' && (
            !ready ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'var(--color-warm-border)',
                    borderTopColor: 'var(--color-terracotta)',
                  }}
                />
                <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>加载中…</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-20 animate-fade-up">
                <div className="card-warm !rounded-2xl p-8 text-center max-w-sm">
                  <span className="text-3xl mb-3 block">📖</span>
                  <p className="font-body text-sm" style={{ color: 'var(--color-ink-muted)' }}>{error}</p>
                  <button onClick={loadWords} className="btn-primary mt-5">
                    重试
                  </button>
                </div>
              </div>
            ) : roundComplete ? (
              /* 本轮完成 */
              <div className="text-center py-12 animate-scale-in">
                <div className="card-warm !rounded-2xl px-8 py-10 max-w-sm mx-auto">
                  <span className="text-5xl block mb-4">🎉</span>
                  <p className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                    本轮完成！
                  </p>
                  <p className="font-body text-sm mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                    已学 <strong className="font-display" style={{ color: 'var(--color-ink-soft)' }}>{words.length}</strong> 个单词 · 掌握{' '}
                    <strong className="font-display" style={{ color: 'var(--color-sage)' }}>{stats.known}</strong> 个
                  </p>
                  <div className="flex flex-col gap-2 mt-7">
                    <button
                      onClick={loadWords}
                      className="btn-primary"
                    >
                      继续背单词
                    </button>
                    <button
                      onClick={handleChangeRoundSize}
                      className="btn-secondary text-xs"
                    >
                      每轮 {roundSize} 词
                    </button>
                  </div>
                </div>
              </div>
            ) : words.length === 0 ? (
              <div className="text-center py-20 animate-fade-up">
                <div className="card-warm !rounded-2xl px-8 py-10 max-w-sm mx-auto">
                  <span className="text-5xl block mb-4">🎉</span>
                  <p className="font-display text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                    今天没有需要复习的单词
                  </p>
                  <p className="font-body text-sm mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                    明天再来看看吧
                  </p>
                  <button onClick={loadWords} className="btn-primary mt-7">
                    刷新
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    <span className="font-display font-semibold" style={{ color: 'var(--color-ink-soft)' }}>
                      {index + 1}
                    </span>
                    <span className="opacity-40"> / {words.length}</span>
                  </span>
                  <button
                    onClick={handleChangeRoundSize}
                    className="font-ui text-[11px] transition-colors underline underline-offset-2"
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
                    每轮 {roundSize} 词
                  </button>
                </div>
                <FlashCard
                  key={words[index]?.id}
                  word={words[index]}
                  onKnown={() => handleResult(true)}
                  onUnknown={() => handleResult(false)}
                />
              </div>
            )
          )}

          {/* ========== 搜索 ========== */}
          {mode === 'search' && (
            <div className="animate-fade-up">
              <div className="card-warm !rounded-2xl p-5">
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => doSearch(e.target.value)}
                    placeholder="输入单词搜索..."
                    className="input-warm !pl-9"
                    autoFocus
                  />
                </div>

                {searching && (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: 'var(--color-warm-border)',
                        borderTopColor: 'var(--color-terracotta)',
                      }}
                    />
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="mt-4 space-y-2 stagger">
                    {searchResults.map((w, i) => (
                      <div
                        key={w.id}
                        className="rounded-xl p-4 transition-all hover:-translate-y-0.5 duration-200"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          border: '1px solid var(--color-warm-border)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                            {w.word}
                          </span>
                          {w.phonetic && (
                            <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>{w.phonetic}</span>
                          )}
                        </div>
                        <p className="font-body text-sm leading-relaxed mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                          {renderMeaning(w.meaning)}
                        </p>
                        {w.example && (
                          <p className="font-body text-xs italic mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                            例：{w.example}
                          </p>
                        )}
                        {w.progress ? (
                          <div className="flex gap-3 font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                            <span>复习 {w.progress.review_count} 次</span>
                            <span style={{ color: 'var(--color-sage)' }}>✓{w.progress.times_known}</span>
                            <span style={{ color: 'var(--color-terracotta)' }}>✗{w.progress.times_unknown}</span>
                            <span className="opacity-60">{w.progress.status === 'known' ? '已掌握' : '学习中'}</span>
                          </div>
                        ) : (
                          <p className="font-ui text-xs opacity-40" style={{ color: 'var(--color-ink-muted)' }}>尚未学习</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-3xl mb-3 block">🔍</span>
                    <p className="font-body text-sm" style={{ color: 'var(--color-ink-muted)' }}>未找到匹配的单词</p>
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div className="text-center py-12">
                    <span className="text-3xl mb-3 block">✏️</span>
                    <p className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      <span className="opacity-40">输入至少 2 个字母开始搜索</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== 易错词 ========== */}
          {mode === 'difficult' && (
            <div className="animate-fade-up">
              {!difficultLoaded ? (
                <div className="flex justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'var(--color-warm-border)',
                      borderTopColor: 'var(--color-terracotta)',
                    }}
                  />
                </div>
              ) : difficultWords.length === 0 ? (
                <div className="card-warm !rounded-2xl text-center py-14 px-8">
                  <span className="text-4xl mb-3 block">📚</span>
                  <p className="font-body text-sm" style={{ color: 'var(--color-ink-soft)' }}>还没有易错词</p>
                  <p className="font-ui text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                    <span className="opacity-60">标记"不认识"≥2 次的单词会出现在这里</span>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      <span className="font-display font-semibold" style={{ color: 'var(--color-terracotta)' }}>{difficultWords.length}</span>{' '}
                      个易错词
                    </p>
                    <button
                      onClick={() => { setDifficultLoaded(false); loadDifficultWords() }}
                      className="font-ui text-xs transition-colors"
                      style={{ color: 'var(--color-terracotta)' }}
                    >
                      刷新
                    </button>
                  </div>
                  <div className="space-y-2 stagger">
                    {difficultWords.map(w => (
                      <div
                        key={w.id}
                        className="card-warm !rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                            {w.word}
                          </span>
                          <span
                            className="font-ui text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'rgba(194, 120, 92, 0.08)',
                              color: 'var(--color-rose-warm)',
                            }}
                          >
                            错 {w.progress?.times_unknown} 次
                          </span>
                        </div>
                        <p className="font-body text-sm leading-relaxed mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                          {renderMeaning(w.meaning)}
                        </p>
                        {w.example && (
                          <p className="font-body text-xs italic" style={{ color: 'var(--color-ink-muted)' }}>
                            例：{w.example}
                          </p>
                        )}
                        <div className="flex gap-3 font-ui text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                          <span>复习 {w.progress?.review_count || 0} 次</span>
                          <span style={{ color: 'var(--color-sage)' }}>✓{w.progress?.times_known || 0}</span>
                          <span style={{ color: 'var(--color-rose-warm)' }}>✗{w.progress?.times_unknown || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== 周报 ========== */}
          {mode === 'weekly' && (
            <div className="animate-fade-up">
              {!weeklyLoaded ? (
                <div className="flex justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: 'var(--color-warm-border)',
                      borderTopColor: 'var(--color-terracotta)',
                    }}
                  />
                </div>
              ) : weekly && weekly.totalReviewed > 0 ? (
                <div>
                  {/* 周总览 */}
                  <div className="card-warm !rounded-2xl p-5 mb-3">
                    <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
                      本周概览
                    </h3>
                    <div className="flex justify-center gap-6 text-center">
                      <div>
                        <div className="font-display text-2xl font-semibold" style={{ color: 'var(--color-terracotta)' }}>
                          {weekly.totalReviewed}
                        </div>
                        <div className="font-ui text-[10px] mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>本周复习</div>
                      </div>
                      <div>
                        <div className="font-display text-2xl font-semibold" style={{ color: 'var(--color-sage)' }}>
                          {weekly.totalNew}
                        </div>
                        <div className="font-ui text-[10px] mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>新学单词</div>
                      </div>
                      <div>
                        <div className="font-display text-2xl font-semibold" style={{ color: 'var(--color-terracotta-light)' }}>
                          {weekly.totalReviewed > 0 ? Math.round((weekly.totalNew / weekly.totalReviewed) * 100) : 0}%
                        </div>
                        <div className="font-ui text-[10px] mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>新词占比</div>
                      </div>
                    </div>
                  </div>

                  {/* 每日柱状图 */}
                  <div className="card-warm !rounded-2xl p-5">
                    <h3 className="font-display text-sm font-semibold mb-4" style={{ color: 'var(--color-ink)' }}>
                      每日趋势
                    </h3>
                    <div className="flex items-end justify-between gap-1" style={{ height: '120px' }}>
                      {weekly.days.map((d, i) => {
                        const maxTotal = Math.max(...weekly.days.map(x => x.reviewed + x.newWords), 1)
                        const scale = 100 / maxTotal
                        const h = Math.max(4, d.reviewed * scale)
                        const newH = d.newWords > 0 ? Math.max(2, d.newWords * scale) : 0
                        const isToday = i === weekly.days.length - 1
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                            <span className="font-ui text-[9px] font-medium" style={{ color: 'var(--color-ink-soft)' }}>
                              {d.reviewed || ''}
                            </span>
                            <div className="w-full max-w-[28px] mx-auto flex flex-col-reverse">
                              <div
                                className="w-full rounded-t-sm transition-all duration-300"
                                style={{
                                  height: `${h}px`,
                                  backgroundColor: isToday ? 'var(--color-terracotta)' : 'var(--color-terracotta-light)',
                                }}
                              />
                              {d.newWords > 0 && (
                                <div
                                  className="w-full rounded-t-sm"
                                  style={{
                                    height: `${newH}px`,
                                    backgroundColor: 'var(--color-sage)',
                                    marginBottom: '1px',
                                  }}
                                />
                              )}
                            </div>
                            <span
                              className="font-ui text-[9px]"
                              style={{
                                color: isToday ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
                                fontWeight: isToday ? 600 : 400,
                              }}
                            >
                              {d.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {/* 图例 */}
                    <div className="flex justify-center gap-4 mt-4 font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-terracotta-light)' }} />
                        复习
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-sage)' }} />
                        新学
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-warm !rounded-2xl text-center py-14 px-8">
                  <span className="text-4xl mb-3 block">📊</span>
                  <p className="font-body text-sm" style={{ color: 'var(--color-ink-soft)' }}>本周还没有学习记录</p>
                  <p className="font-ui text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                    <span className="opacity-60">开始背单词后会显示在这里</span>
                  </p>
                  <button onClick={() => setMode('flashcard')} className="btn-primary mt-6">
                    去背单词
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========== 互动出题（占位） ========== */}
          {mode !== 'flashcard' && mode !== 'search' && mode !== 'difficult' && mode !== 'weekly' && (
            <div className="card-warm !rounded-2xl text-center py-14 px-8">
              <span className="text-4xl mb-3 block">💝</span>
              <p className="font-body text-sm" style={{ color: 'var(--color-ink-soft)' }}>互动出题需要关联伴侣账号</p>
              <p className="font-ui text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                <span className="opacity-60">即将开发</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── 统计单词列表弹窗 ─── */}
      {statList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setStatList(null)}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />

          {/* 面板 */}
          <div
            className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl shadow-xl animate-scale-in"
            style={{
              backgroundColor: 'var(--color-warm-bg-card)',
              border: '1px solid var(--color-warm-border)',
              borderBottom: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="shrink-0">
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-warm-border)' }}>
                <h2 className="font-display text-base font-semibold" style={{ color: 'var(--color-ink)' }}>
                  {statList.title}
                  <span className="font-ui text-xs font-normal ml-2" style={{ color: 'var(--color-ink-muted)' }}>
                    {statList.loading ? '加载中…' : `${statList.words.length} 个词`}
                  </span>
                </h2>
                <button
                  onClick={() => setStatList(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ color: 'var(--color-ink-muted)' }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(232,221,208,0.5)')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {/* 搜索框 */}
              {!statList.loading && statList.words.length > 0 && (
                <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--color-warm-border)' }}>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <input
                      type="text"
                      value={statSearch}
                      onChange={e => setStatSearch(e.target.value)}
                      placeholder="在当前列表中搜索单词..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none font-ui"
                      style={{
                        backgroundColor: 'rgba(232, 221, 208, 0.2)',
                        color: 'var(--color-ink)',
                        border: '1px solid transparent',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-warm-border)' }}
                      onBlur={e => { e.target.style.borderColor = 'transparent' }}
                    />
                    {statSearch && (
                      <button
                        onClick={() => setStatSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-ink-muted)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: 'contain' }}>
              {statList.loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }}
                  />
                </div>
              ) : (() => {
                const filtered = statSearch
                  ? statList.words.filter(w =>
                      w.word.toLowerCase().includes(statSearch.toLowerCase()) ||
                      w.meaning.toLowerCase().includes(statSearch.toLowerCase())
                    )
                  : statList.words
                return filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-3xl mb-2 block">🔍</span>
                    <p className="font-body text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                      {statSearch ? '未找到匹配的单词' : '暂无单词'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setConsultWord(w)}
                        className="w-full text-left rounded-xl p-4 transition-all hover:-translate-y-0.5 duration-200 active:scale-[0.99]"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          border: '1px solid var(--color-warm-border)',
                          cursor: 'pointer',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
                            {w.word}
                          </span>
                          <div className="flex items-center gap-2">
                            {w.phonetic && (
                              <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>{w.phonetic}</span>
                            )}
                            {w.progress && (
                              <span
                                className="font-ui text-[10px] px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: w.progress.status === 'known'
                                    ? 'rgba(107, 143, 113, 0.1)'
                                    : 'rgba(184, 101, 43, 0.08)',
                                  color: w.progress.status === 'known'
                                    ? 'var(--color-sage)'
                                    : 'var(--color-terracotta)',
                                }}
                              >
                                {w.progress.status === 'known' ? '已掌握' : '学习中'}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-body text-sm leading-relaxed mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                          {renderMeaning(w.meaning)}
                        </p>
                        {w.example && (
                          <p className="font-body text-xs italic mb-2" style={{ color: 'var(--color-ink-muted)' }}>
                            例：{w.example}
                          </p>
                        )}
                        {w.progress ? (
                          <div className="flex gap-3 font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                            <span>复习 {w.progress.review_count} 次</span>
                            <span style={{ color: 'var(--color-sage)' }}>✓{w.progress.times_known}</span>
                            <span style={{ color: 'var(--color-terracotta)' }}>✗{w.progress.times_unknown}</span>
                          </div>
                        ) : (
                          <p className="font-ui text-xs opacity-40" style={{ color: 'var(--color-ink-muted)' }}>尚未学习</p>
                        )}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      )}

      {/* ─── 单词咨询弹窗 ─── */}
      {consultWord && statList && (() => {
        // 计算当前显示的单词列表和当前词的索引
        const wordList = statSearch
          ? statList.words.filter(w =>
              w.word.toLowerCase().includes(statSearch.toLowerCase()) ||
              w.meaning.toLowerCase().includes(statSearch.toLowerCase())
            )
          : statList.words
        const currentIndex = wordList.findIndex(w => w.id === consultWord.id)

        function goPrev() {
          if (currentIndex > 0) setConsultWord(wordList[currentIndex - 1])
        }
        function goNext() {
          if (currentIndex < wordList.length - 1) setConsultWord(wordList[currentIndex + 1])
        }

        return (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          onClick={() => setConsultWord(null)}
        >
          <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl shadow-xl animate-scale-in overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #FEFCF8 0%, #F9F3E8 100%)',
              border: '1px solid rgba(232, 221, 208, 0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* 顶部装饰线 */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40 mx-8" />

            {/* 内容 */}
            <div className="px-6 py-6 text-center">
              {/* 单词 */}
              <div className="mb-2">
                <span className="font-display text-3xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                  {consultWord.word}
                </span>
              </div>

              {/* 音标 */}
              {consultWord.phonetic && (
                <span className="font-ui text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                  {consultWord.phonetic}
                </span>
              )}

              {/* 分隔 */}
              <div className="w-8 h-px mx-auto my-4 rounded-full bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent" />

              {/* 释义 */}
              <div className="text-center">
                <p className="font-body text-base leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
                  {renderMeaning(consultWord.meaning)}
                </p>
              </div>

              {/* 例句 */}
              {consultWord.example && (
                <div className="mt-4 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(232, 221, 208, 0.2)' }}>
                  <p className="font-body text-sm italic leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                    &ldquo;{consultWord.example}&rdquo;
                  </p>
                </div>
              )}

              {/* 学习统计 */}
              {consultWord.progress && (
                <div className="mt-4 flex justify-center gap-4 font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  <span>复习 {consultWord.progress.review_count} 次</span>
                  <span style={{ color: 'var(--color-sage)' }}>✓{consultWord.progress.times_known}</span>
                  <span style={{ color: 'var(--color-terracotta)' }}>✗{consultWord.progress.times_unknown}</span>
                  <span
                    style={{
                      color: consultWord.progress.status === 'known' ? 'var(--color-sage)' : 'var(--color-terracotta)',
                    }}
                  >
                    {consultWord.progress.status === 'known' ? '已掌握' : '学习中'}
                  </span>
                </div>
              )}

              {/* 频率 + 真题 */}
              <div className="mt-3 flex justify-center gap-2 flex-wrap">
                {consultWord.frequency && (
                  <span className="font-ui text-[10px] px-2 py-0.5 rounded-full inline-block" style={{
                    backgroundColor: 'rgba(184, 101, 43, 0.06)',
                    color: 'var(--color-ink-muted)',
                  }}>
                    频度：{consultWord.frequency === 'high' ? '高频' : consultWord.frequency === 'medium' ? '中频' : '低频'}
                  </span>
                )}
                {consultWord.metadata?.exam_frequency > 0 && (
                  <span className="font-ui text-[10px] px-2 py-0.5 rounded-full inline-block"
                    style={{ backgroundColor: 'rgba(184, 101, 43, 0.06)', color: 'var(--color-terracotta)' }}
                  >
                    真题出现 {consultWord.metadata.exam_frequency} 次
                  </span>
                )}
              </div>
            </div>

            {/* 底部操作：翻页 + 关闭 */}
            <div className="px-6 pb-6">
              {/* 页码 */}
              <p className="font-ui text-[11px] text-center mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                {currentIndex + 1} / {wordList.length}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={goPrev}
                  disabled={currentIndex <= 0}
                  className="flex items-center gap-1 font-ui text-xs px-4 py-2 rounded-full transition-all disabled:opacity-30"
                  style={{
                    color: 'var(--color-ink-muted)',
                    border: '1px solid var(--color-warm-border)',
                  }}
                  onMouseOver={e => { if (currentIndex > 0) e.currentTarget.style.backgroundColor = 'rgba(232,221,208,0.3)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  上一个
                </button>
                <button
                  onClick={() => setConsultWord(null)}
                  className="font-ui text-xs px-5 py-2 rounded-full transition-all"
                  style={{
                    color: 'var(--color-ink-muted)',
                    border: '1px solid var(--color-warm-border)',
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(232,221,208,0.3)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  关闭
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex >= wordList.length - 1}
                  className="flex items-center gap-1 font-ui text-xs px-4 py-2 rounded-full transition-all disabled:opacity-30"
                  style={{
                    color: 'var(--color-ink-muted)',
                    border: '1px solid var(--color-warm-border)',
                  }}
                  onMouseOver={e => { if (currentIndex < wordList.length - 1) e.currentTarget.style.backgroundColor = 'rgba(232,221,208,0.3)' }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  下一个
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>

            {/* 底部装饰线 */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40 mx-8" />
          </div>
        </div>
        )
      })()}
    </div>
  )
}
