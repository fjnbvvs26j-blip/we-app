import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/', label: '首页', emoji: '🏠', activeEmoji: '🏡' },
  { path: '/vocab', label: '单词', emoji: '📖', activeEmoji: '📚' },
]

export default function BottomNav() {
  const location = useLocation()
  const currentPath = location.pathname === '/' ? '/' : '/vocab'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center gap-0"
      style={{
        backgroundColor: 'rgba(252, 247, 240, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--color-warm-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map(tab => {
        const active = currentPath === tab.path
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 max-w-[140px] transition-all duration-200"
          >
            <span className="text-xl leading-none transition-transform duration-200"
              style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}>
              {active ? tab.activeEmoji : tab.emoji}
            </span>
            <span
              className="font-ui text-[11px] font-medium transition-colors duration-200"
              style={{ color: active ? 'var(--color-terracotta)' : 'var(--color-ink-muted)' }}
            >
              {tab.label}
            </span>
            {/* 活跃指示点 */}
            <span
              className="w-1 h-1 rounded-full transition-all duration-200"
              style={{
                backgroundColor: active ? 'var(--color-terracotta)' : 'transparent',
                marginTop: '1px',
                transform: active ? 'scale(1)' : 'scale(0)',
              }}
            />
          </Link>
        )
      })}
    </nav>
  )
}
