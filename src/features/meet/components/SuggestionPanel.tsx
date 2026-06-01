import { useState } from 'react'
import type { Suggestion, MeetingPlan, CalendarEntry } from '../meet.types'
import { generateSuggestions, analyzeAvailability } from '../meet.suggestions'

type Props = {
  plan: Partial<MeetingPlan>
  myEntries?: CalendarEntry[]
  partnerEntries?: CalendarEntry[]
  year?: number
  month?: number
  onApply: (suggestion: Suggestion) => void
  onClose: () => void
}

export default function SuggestionPanel({ plan, myEntries, partnerEntries, year, month, onApply, onClose }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  function generate() {
    setLoading(true)
    // Simulate slight delay for UX
    setTimeout(() => {
      const all: Suggestion[] = []

      // Meeting plan suggestions
      const planSuggestions = generateSuggestions(plan)
      all.push(...planSuggestions)

      // Availability analysis
      if (myEntries && partnerEntries && year && month) {
        const availability = analyzeAvailability(myEntries, partnerEntries, year, month)
        all.push(...availability)
      }

      setSuggestions(all)
      setLoading(false)
    }, 400)
  }

  function handleApply(s: Suggestion) {
    if (appliedIds.has(s.id)) return
    setAppliedIds(prev => new Set(prev).add(s.id))
    onApply(s)
  }

  const TYPE_ICONS: Record<string, string> = {
    time_split: '⏰',
    date_idea: '💑',
    transport: '🚄',
    packing: '🎒',
    budget: '💰',
    itinerary: '📋',
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up rounded-t-3xl pb-safe-bottom"
        style={{
          backgroundColor: 'var(--color-warm-bg-card)',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          boxShadow: '0 -4px 24px rgba(44, 24, 16, 0.08)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        </div>

        <div className="px-6 pb-8">
          <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
            🤖 AI 建议
          </h3>
          <p className="font-ui text-[10px] mb-4" style={{ color: 'var(--color-ink-muted)' }}>
            基于规则引擎生成，无需网络 · 点击可采纳建议
          </p>

          {!suggestions && !loading && (
            <button
              onClick={generate}
              className="w-full py-4 rounded-2xl text-center transition-all card-warm hover:shadow-md"
            >
              <span className="text-2xl block mb-2">✨</span>
              <span className="font-ui text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                生成建议
              </span>
              <p className="font-ui text-[10px] mt-1" style={{ color: 'var(--color-ink-muted)' }}>
                根据当前规划生成时间分配、约会点子、出行提醒等
              </p>
            </button>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8">
              <div className="w-6 h-6 rounded-full border-2 animate-spin mb-2"
                style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }}
              />
              <span className="font-ui text-[10px]" style={{ color: 'var(--color-ink-muted)' }}>正在生成建议…</span>
            </div>
          )}

          {suggestions && (
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-2xl block mb-2">🤔</span>
                  <p className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    暂时没有建议，多填些信息试试
                  </p>
                </div>
              ) : (
                suggestions.map(s => (
                  <div key={s.id} className="card-warm !rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{TYPE_ICONS[s.type] || '💡'}</span>
                          <h4 className="font-ui text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                            {s.title}
                          </h4>
                        </div>
                        <p className="font-body text-xs mb-2" style={{ color: 'var(--color-ink-soft)' }}>
                          {s.description}
                        </p>
                        {s.details.length > 0 && (
                          <ul className="space-y-1">
                            {s.details.map((d, i) => (
                              <li key={i} className="font-ui text-[11px] flex items-start gap-1.5" style={{ color: 'var(--color-ink-muted)' }}>
                                <span className="mt-0.5">•</span>
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {s.actionable && (
                        <button
                          onClick={() => handleApply(s)}
                          disabled={appliedIds.has(s.id)}
                          className={`flex-shrink-0 font-ui text-[10px] px-3 py-1.5 rounded-full transition-all ${
                            appliedIds.has(s.id) ? 'opacity-40' : ''
                          }`}
                          style={{
                            backgroundColor: appliedIds.has(s.id) ? 'rgba(107, 143, 113, 0.1)' : 'rgba(184, 101, 43, 0.08)',
                            color: appliedIds.has(s.id) ? 'var(--color-sage)' : 'var(--color-terracotta)',
                          }}
                        >
                          {appliedIds.has(s.id) ? '✓ 已采纳' : '采纳'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {suggestions && suggestions.length > 0 && (
            <button
              onClick={generate}
              className="w-full mt-3 py-2.5 rounded-xl font-ui text-xs font-medium transition-all"
              style={{
                backgroundColor: 'rgba(184, 101, 43, 0.06)',
                color: 'var(--color-terracotta)',
              }}
            >
              重新生成
            </button>
          )}
        </div>
      </div>
    </>
  )
}
