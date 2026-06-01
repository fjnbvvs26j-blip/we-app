import { useAuth } from '@/shared/hooks/useAuth'
import PartnerBanner from '@/features/home/components/PartnerBanner'
import PartnerLink from '@/features/home/components/PartnerLink'
import StatusBar from '@/features/home/components/StatusBar'
import CountdownCard from '@/features/home/components/CountdownCard'
import QuickStats from '@/features/home/components/QuickStats'

export default function HomePage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-cream)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
          我们
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

      <div className="px-5 stagger">
        {/* 伴侣关联 */}
        {user?.partner_id ? <PartnerBanner /> : <PartnerLink />}

        {/* 状态栏 */}
        <StatusBar key={user?.id} />

        {/* 见面倒计时 */}
        <CountdownCard />

        {/* 学习概览 */}
        <QuickStats />

        {/* 预留空间：未来每日话题、时光便签入口 */}
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-3 px-2">
            <span className="deco-dot opacity-25" />
            <span className="deco-dot opacity-25" />
            <span className="deco-dot opacity-25" />
          </div>
        </div>
      </div>
    </div>
  )
}
