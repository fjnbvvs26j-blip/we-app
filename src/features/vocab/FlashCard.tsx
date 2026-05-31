import { useState } from 'react'
import type { VocabWord } from './vocab.types'

function RichMeaning({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className="font-body text-base md:text-lg leading-relaxed text-center" style={{ color: 'var(--color-ink-soft)' }}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-bold" style={{ color: 'var(--color-terracotta)' }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

type Props = {
  word: VocabWord
  onKnown: () => void
  onUnknown: () => void
}

export default function FlashCard({ word, onKnown, onUnknown }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null)

  function handleSwipe(direction: 'left' | 'right') {
    setLeaving(direction)
    setTimeout(() => {
      setFlipped(false)
      setLeaving(null)
      if (direction === 'right') onKnown()
      else onUnknown()
    }, 300)
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 select-none animate-fade-up">
      {/* 提示 */}
      <div className="flex items-center gap-3 font-ui text-xs tracking-wide" style={{ color: 'var(--color-ink-muted)' }}>
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          点击翻转
        </span>
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          左滑不认识
        </span>
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-warm-border)' }} />
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          右滑认识
        </span>
      </div>

      {/* 卡片 */}
      <div
        onClick={() => !leaving && setFlipped(!flipped)}
        className={`
          relative w-full max-w-sm aspect-[4/3] cursor-pointer
          transition-all duration-300
          ${leaving === 'right' ? 'translate-x-[200%] opacity-0 rotate-6' : ''}
          ${leaving === 'left' ? '-translate-x-[200%] opacity-0 -rotate-6' : ''}
        `}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ─── 正面：单词 ─── */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3 px-6"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(160deg, #FEFCF8 0%, #F9F3E8 100%)',
              boxShadow: '0 2px 4px rgba(44, 24, 16, 0.06), 0 8px 24px rgba(44, 24, 16, 0.04)',
              border: '1px solid rgba(232, 221, 208, 0.4)',
            }}
          >
            {/* 顶部装饰线 */}
            <div className="absolute top-4 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40" />

            <span
              className="font-display text-[2.5rem] md:text-[2.75rem] font-bold tracking-tight text-center"
              style={{ color: 'var(--color-ink)' }}
            >
              {word.word}
            </span>

            {word.phonetic && (
              <span className="font-ui text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                {word.phonetic}
              </span>
            )}

            {(word.metadata?.exam_frequency || 0) > 0 && (
              <span
                className="font-ui text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  color: 'var(--color-terracotta)',
                  backgroundColor: 'rgba(184, 101, 43, 0.08)',
                }}
              >
                真题出现 {word.metadata.exam_frequency} 次
              </span>
            )}

            {/* 底部装饰线 */}
            <div className="absolute bottom-4 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40" />

            {/* 翻转提示 */}
            <span className="font-ui text-[11px] absolute bottom-7" style={{ color: 'var(--color-ink-muted)' }}>
              <span className="opacity-40">点击翻转</span>
            </span>
          </div>

          {/* ─── 背面：释义 ─── */}
          <div
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-4 px-6 py-6 overflow-auto"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(160deg, #FEFAF3 0%, #F8F0E3 100%)',
              boxShadow: '0 2px 4px rgba(44, 24, 16, 0.06), 0 8px 24px rgba(44, 24, 16, 0.04)',
              border: '1px solid rgba(232, 221, 208, 0.4)',
            }}
          >
            {/* 顶部装饰线 */}
            <div className="absolute top-4 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40" />

            <RichMeaning text={word.meaning} />

            {word.example && (
              <div className="relative px-4 py-2 rounded-lg w-full max-w-xs" style={{ backgroundColor: 'rgba(232, 221, 208, 0.2)' }}>
                <span className="font-body text-sm italic leading-relaxed block text-center" style={{ color: 'var(--color-ink-muted)' }}>
                  &ldquo;{word.example}&rdquo;
                </span>
              </div>
            )}

            {/* 底部装饰线 */}
            <div className="absolute bottom-4 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#D4C8B8] to-transparent opacity-40" />
          </div>
        </div>
      </div>

      {/* ─── 操作按钮 ─── */}
      <div className="flex gap-6 mt-1">
        <button
          onClick={() => handleSwipe('left')}
          className="group relative w-16 h-16 rounded-full flex items-center justify-center font-ui text-sm font-medium transition-all active:scale-90"
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--color-warm-border)',
            color: 'var(--color-ink-muted)',
          }}
        >
          <span className="relative z-10" style={{ fontFamily: 'var(--font-body)' }}>不认识</span>
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(194, 120, 92, 0.06)' }}
          />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full flex items-center justify-center font-ui text-sm font-medium transition-all active:scale-90"
          style={{
            background: 'linear-gradient(135deg, var(--color-sage), var(--color-sage-light))',
            color: 'white',
            boxShadow: '0 2px 8px rgba(107, 143, 113, 0.25)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-body)' }}>认识</span>
        </button>
      </div>
    </div>
  )
}
