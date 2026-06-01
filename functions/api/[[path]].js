// Cloudflare Pages Function — Supabase API 代理
// 浏览器 → Cloudflare Worker（全球节点）→ Supabase（东京）
// 每天 10 万次免费调用，国内可直连
const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'

export async function onRequest(context) {
  const { request } = context

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // 构造目标 URL
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api/, '')
  const supabaseUrl = `${SUPABASE_URL}${path}${url.search}`

  // 转发请求头（去 host/origin 避免 CORS）
  const headers = new Headers()
  for (const [k, v] of request.headers) {
    if (k !== 'host' && k !== 'origin' && k !== 'referer') {
      headers.set(k, v)
    }
  }

  try {
    const response = await fetch(supabaseUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    })

    // 组装返回头
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    })
    response.headers.forEach((v, k) => {
      if (k !== 'content-encoding' && k !== 'transfer-encoding') {
        responseHeaders.set(k, v)
      }
    })

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
