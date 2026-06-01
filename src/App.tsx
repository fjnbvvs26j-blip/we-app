import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/shared/hooks/useAuth'
import AuthPage from '@/features/auth/AuthPage'
import HomePage from '@/features/home/HomePage'
import BottomNav from '@/shared/components/BottomNav'

const VocabPage = lazy(() => import('@/features/vocab/VocabPage'))

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-warm-border)', borderTopColor: 'var(--color-terracotta)' }}
        />
        <span className="font-ui text-xs" style={{ color: 'var(--color-ink-muted)' }}>加载中…</span>
      </div>
    </div>
  )
}

function LayoutWithNav() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={
        session ? <LayoutWithNav /> : <Navigate to="/auth" />
      }>
        <Route index element={<HomePage />} />
        <Route path="vocab" element={
          <Suspense fallback={<PageFallback />}>
            <VocabPage />
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
