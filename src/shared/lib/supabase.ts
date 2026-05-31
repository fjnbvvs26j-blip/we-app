import { createClient } from '@supabase/supabase-js'

// 生产环境走 Netlify Function 代理（/api → supabase.co），绕过国内 DNS 封锁
// 本地开发直连 Supabase
const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'
const supabaseUrl = isLocal
  ? import.meta.env.VITE_SUPABASE_URL
  : '/api'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 自定义 fetch：对所有请求加 12 秒超时，防止网络不通时无限挂起
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  // 如果已有外部 signal，合并；否则直接用 controller.signal
  const signal = init?.signal ? combineSignals(init.signal, controller.signal) : controller.signal

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeoutId))
}

// 合并两个 AbortSignal：任一触发即 abort
function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  a.addEventListener('abort', onAbort)
  b.addEventListener('abort', onAbort)
  return controller.signal
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { timeout: 10000 },
  global: { fetch: fetchWithTimeout },
})
