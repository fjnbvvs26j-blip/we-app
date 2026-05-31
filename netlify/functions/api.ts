import type { Handler } from '@netlify/functions'

// Supabase 项目地址（Netlify 服务器在美国，可以直连 Supabase）
const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'

export const handler: Handler = async (event) => {
  // 处理 CORS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'access-control-allow-headers': '*',
        'access-control-max-age': '86400',
      },
      body: '',
    }
  }

  const path = event.path.replace(/^\/api/, '')
  const url = `${SUPABASE_URL}${path}${event.rawQuery ? '?' + event.rawQuery : ''}`

  // 转发请求头（去掉 host/origin 避免 CORS 问题）
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(event.headers)) {
    if (k !== 'host' && k !== 'origin' && k !== 'referer') {
      headers[k] = v || ''
    }
  }

  try {
    const response = await fetch(url, {
      method: event.httpMethod,
      headers,
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body
        ? event.isBase64Encoded
          ? Buffer.from(event.body, 'base64')
          : event.body
        : undefined,
    })

    // 返回响应头
    const responseHeaders: Record<string, string> = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
    }
    response.headers.forEach((v, k) => {
      if (k !== 'content-encoding' && k !== 'transfer-encoding') {
        responseHeaders[k] = v
      }
    })

    const body = await response.text()

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({ error: 'Proxy error', detail: String(err) }),
    }
  }
}
