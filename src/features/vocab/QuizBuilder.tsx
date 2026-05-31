import { useState, useEffect } from 'react'
import { vocabService } from './vocab.service'
import { useAuth } from '@/shared/hooks/useAuth'
import { supabase } from '@/shared/lib/supabase'
import type { VocabWord, VocabQuiz, QuizType } from './vocab.types'

type Props = {
  mode: 'outgoing' | 'incoming'
}

export default function QuizBuilder({ mode }: Props) {
  const { profile } = useAuth()
  const [words, setWords] = useState<VocabWord[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [quizType, setQuizType] = useState<QuizType>('en_to_cn')
  const [quizzes, setQuizzes] = useState<VocabQuiz[]>([])
  const [activeQuiz, setActiveQuiz] = useState<VocabQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [encouragement, setEncouragement] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'create' | 'list' | 'answer' | 'review'>('list')

  useEffect(() => {
    loadWords()
    loadQuizzes()
  }, [mode])

  async function loadWords() {
    const data = await vocabService.getWords(undefined, 50)
    setWords(data)
  }

  async function loadQuizzes() {
    if (!profile) return
    const fn = mode === 'outgoing' ? vocabService.getOutgoingQuizzes : vocabService.getPendingQuizzes
    const data = await fn(profile.id)
    setQuizzes(data)
  }

  async function handleCreate() {
    if (!profile) return
    setLoading(true)
    try {
      // 获取伴侣 ID
      const { data: partner } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', profile.id)
        .single()

      const partnerId = partner?.partner_id
      if (!partnerId) { alert('请先在设置中关联伴侣'); return }

      await vocabService.createQuiz(profile.id, partnerId, quizType, Array.from(selected))
      setSelected(new Set())
      loadQuizzes()
      setTab('list')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitQuiz() {
    if (!activeQuiz) return
    let score = 0
    const wordList = activeQuiz.words as unknown as { word_id: string; word: string; meaning: string }[]
    wordList.forEach(w => {
      const userAnswer = answers[w.word_id]?.trim().toLowerCase()
      const correct = activeQuiz.quiz_type === 'en_to_cn'
        ? w.meaning.toLowerCase()
        : w.word.toLowerCase()
      if (userAnswer === correct) score++
    })
    await vocabService.submitQuiz(activeQuiz.id, score)
    setActiveQuiz(null)
    setAnswers({})
    loadQuizzes()
  }

  async function handleReview(quizId: string) {
    await vocabService.reviewQuiz(quizId, encouragement)
    setEncouragement('')
    setTab('list')
    loadQuizzes()
  }

  // Answer mode
  if (tab === 'answer' && activeQuiz) {
    const wordList = activeQuiz.words as unknown as { word_id: string; word: string; meaning: string }[]
    return (
      <div className="space-y-4">
        <button onClick={() => setTab('list')} className="text-sm text-indigo-500">&larr; 返回</button>
        <h3 className="font-medium text-gray-700">
          {activeQuiz.quiz_type === 'en_to_cn' ? '英译中' : activeQuiz.quiz_type === 'cn_to_en' ? '中译英' : '拼写'}
        </h3>
        {wordList.map((w) => (
          <div key={w.word_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-lg font-bold text-gray-800 mb-2">
              {activeQuiz.quiz_type === 'en_to_cn' ? w.word : w.meaning}
            </p>
            <input
              type="text"
              value={answers[w.word_id] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [w.word_id]: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 text-sm"
              placeholder="输入你的答案"
            />
          </div>
        ))}
        <button
          onClick={handleSubmitQuiz}
          className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
        >
          提交
        </button>
      </div>
    )
  }

  // Review mode
  if (tab === 'review' && activeQuiz) {
    const wordList = activeQuiz.words as unknown as { word_id: string; word: string; meaning: string }[]
    return (
      <div className="space-y-4">
        <button onClick={() => setTab('list')} className="text-sm text-indigo-500">&larr; 返回</button>
        <h3 className="font-medium text-gray-700">测验结果</h3>
        <p className="text-2xl font-bold text-indigo-500">{activeQuiz.score} / {activeQuiz.total}</p>
        <div className="space-y-2">
          {wordList.map((w) => (
            <div key={w.word_id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-sm">
              <span className="font-bold">{w.word}</span> — {w.meaning}
            </div>
          ))}
        </div>
        <textarea
          value={encouragement}
          onChange={e => setEncouragement(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 text-sm"
          placeholder="写句鼓励的话..."
          rows={2}
        />
        <button
          onClick={() => handleReview(activeQuiz.id)}
          className="w-full py-3 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors"
        >
          发送鼓励
        </button>
      </div>
    )
  }

  // Create mode
  if (tab === 'create') {
    return (
      <div className="space-y-4">
        <button onClick={() => setTab('list')} className="text-sm text-indigo-500">&larr; 返回</button>
        <h3 className="font-medium text-gray-700">出题</h3>

        <div className="flex gap-2 flex-wrap">
          {(['en_to_cn', 'cn_to_en', 'spelling'] as QuizType[]).map(t => (
            <button
              key={t}
              onClick={() => setQuizType(t)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                quizType === t ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t === 'en_to_cn' ? '英译中' : t === 'cn_to_en' ? '中译英' : '拼写'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {words.map(w => (
            <button
              key={w.id}
              onClick={() => {
                const next = new Set(selected)
                next.has(w.id) ? next.delete(w.id) : next.add(w.id)
                setSelected(next)
              }}
              className={`p-2 rounded-lg text-sm text-left transition-colors ${
                selected.has(w.id) ? 'bg-indigo-100 border border-indigo-300' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <span className="font-medium">{w.word}</span>
              <span className="text-gray-400 ml-1 text-xs">{w.meaning}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={selected.size === 0 || loading}
          className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : `出题 (${selected.size} 个单词)`}
        </button>
      </div>
    )
  }

  // List mode (default)
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {mode === 'outgoing' && (
          <button
            onClick={() => setTab('create')}
            className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-medium"
          >
            + 出新题
          </button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          {mode === 'incoming' ? '还没有收到题目' : '还没有出过题目'}
        </p>
      ) : (
        <div className="space-y-3">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">
                    {q.quiz_type === 'en_to_cn' ? '英译中' : q.quiz_type === 'cn_to_en' ? '中译英' : '拼写'}
                    · {q.total} 题
                  </span>
                  {q.score !== null && (
                    <span className="ml-2 text-sm font-bold text-indigo-500">{q.score}/{q.total}</span>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  q.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {q.status === 'pending' ? '待做' : q.status === 'completed' ? '待查看' : '已查看'}
                </span>
              </div>

              {q.encouragement && (
                <p className="mt-2 text-sm text-pink-500 italic">"{q.encouragement}"</p>
              )}

              {mode === 'incoming' && q.status === 'pending' && (
                <button
                  onClick={() => { setActiveQuiz(q); setTab('answer') }}
                  className="mt-3 w-full py-2 rounded-lg bg-indigo-50 text-indigo-500 text-sm font-medium hover:bg-indigo-100"
                >
                  开始答题
                </button>
              )}

              {mode === 'outgoing' && q.status === 'completed' && (
                <button
                  onClick={() => { setActiveQuiz(q); setTab('review') }}
                  className="mt-3 w-full py-2 rounded-lg bg-pink-50 text-pink-500 text-sm font-medium hover:bg-pink-100"
                >
                  查看结果 & 写鼓励
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
