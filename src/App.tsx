import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/shared/hooks/useAuth'
import AuthPage from '@/features/auth/AuthPage'

const VocabPage = lazy(() => import('@/features/vocab/VocabPage'))

function VocabFallback() {
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

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={
        session ? (
          <Suspense fallback={<VocabFallback />}>
            <VocabPage />
          </Suspense>
        ) : (
          <Navigate to="/auth" />
        )
      } />
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
