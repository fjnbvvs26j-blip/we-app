import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/shared/hooks/useAuth'
import AuthPage from '@/features/auth/AuthPage'
import VocabPage from '@/features/vocab/VocabPage'

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={session ? <VocabPage /> : <Navigate to="/auth" />} />
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
