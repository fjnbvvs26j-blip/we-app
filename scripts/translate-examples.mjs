// 批量翻译例句（英文 → 中文）
// 更新 example 字段为: "英文例句" — 中文翻译
// 用法: node scripts/translate-examples.mjs

const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZ2tyZ2FseGdwYXJrcnl6YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODUsImV4cCI6MjA5NTcxOTc4NX0.CP_FsR87K76MN42NGXXPfZAuMcMp_4A80833KBgsyMQ'

const DELAY = 350 // ms

async function translate(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  const data = await res.json()
  return data[0]?.[0]?.[0] || ''
}

async function main() {
  // 获取所有有例句但还没有中文翻译的词
  console.log('Fetching words with examples...')
  let allWords = []
  let offset = 0
  const LIMIT = 1000
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vocab_words?select=id,word,example&example=not.is.null&limit=${LIMIT}&offset=${offset}`,
      { headers: { 'apikey': ANON_KEY } }
    )
    const batch = await res.json()
    if (!batch || batch.length === 0) break
    allWords = allWords.concat(batch)
    offset += LIMIT
  }

  // 过滤掉已经有中文翻译的（包含中文字符的 example）
  const needTrans = allWords.filter(w => {
    if (!w.example) return false
    // 如果已经包含中文则不翻译
    return !/[一-鿿]/.test(w.example)
  })

  console.log(`Total with examples: ${allWords.length}, need translation: ${needTrans.length}`)

  let done = 0
  let failed = 0

  for (const w of needTrans) {
    try {
      const zh = await translate(w.example)
      if (zh) {
        const newExample = `${w.example} — ${zh}`
        await fetch(`${SUPABASE_URL}/rest/v1/vocab_words?id=eq.${encodeURIComponent(w.id)}`, {
          method: 'PATCH',
          headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ example: newExample }),
        })
        done++
      } else {
        failed++
      }
    } catch {
      failed++
    }

    if ((done + failed) % 100 === 0) {
      console.log(`  progress: ${done + failed}/${needTrans.length} | done: ${done} | failed: ${failed}`)
    }

    await new Promise(r => setTimeout(r, DELAY))
  }

  console.log(`Done! Translated: ${done}, Failed: ${failed}`)
}

main().catch(console.error)
