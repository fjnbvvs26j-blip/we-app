import { supabase } from '@/shared/lib/supabase'

export const authService = {
  signUp(email: string, password: string, nickname: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
  },

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  signOut() {
    return supabase.auth.signOut()
  },

  getSession() {
    return supabase.auth.getSession()
  },

  onAuthChange(callback: (session: unknown) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
  },
}
