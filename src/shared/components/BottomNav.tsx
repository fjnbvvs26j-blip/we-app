import { Link, useLocation } from 'react-router-dom'

const TABS = [
  {
    path: '/',
    label: '首页',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5" />
        <path d="M5 11v8a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-8" />
      </svg>
    ),
  },
  {
    path: '/vocab',
    label: '单词',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()
  const currentPath = location.pathname === '/' ? '/' : '/vocab'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
      style={{
        backgroundColor: 'rgba(252, 247, 240, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(232, 221, 208, 0.6)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-stretch max-w-sm w-full">
        {TABS.map(tab => {
          const active = currentPath === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative"
            >
              {/* 活跃背景 */}
              {active && (
                <div className="absolute top-1.5 bottom-1.5 left-4 right-4 rounded-xl opacity-40"
                  style={{ backgroundColor: 'rgba(184, 101, 43, 0.04)' }} />
              )}

              {/* 图标 */}
              <span className="transition-all duration-200 relative" style={{
                color: active ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
                opacity: active ? 1 : 0.45,
                transform: active ? 'translateY(-1px)' : 'none',
              }}>
                {tab.icon}
              </span>

              {/* 标签 */}
              <span className="font-ui text-[10px] font-medium transition-all duration-200" style={{
                color: active ? 'var(--color-terracotta)' : 'var(--color-ink-muted)',
                opacity: active ? 1 : 0.5,
              }}>
                {tab.label}
              </span>

              {/* 底部指示点 */}
              <span className="w-1 h-1 rounded-full transition-all duration-300" style={{
                backgroundColor: active ? 'var(--color-terracotta)' : 'transparent',
                transform: active ? 'scale(1)' : 'scale(0)',
                marginTop: '1px',
              }} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
