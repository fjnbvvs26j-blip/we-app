// 批量从 Free Dictionary API 获取例句和音标
// 用法: node scripts/fetch-examples.mjs

const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZ2tyZ2FseGdwYXJrcnl6YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODUsImV4cCI6MjA5NTcxOTc4NX0.CP_FsR87K76MN42NGXXPfZAuMcMp_4A80833KBgsyMQ'

const DELAY = 250 // ms between requests

async function main() {
  // 获取所有单词
  console.log('Fetching all words...')
  let allWords = []
  let offset = 0
  const LIMIT = 1000
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vocab_words?select=id,word,phonetic,example&limit=${LIMIT}&offset=${offset}`,
      { headers: { 'apikey': ANON_KEY } }
    )
    const batch = await res.json()
    if (!batch || batch.length === 0) break
    allWords = allWords.concat(batch)
    offset += LIMIT
    console.log(`  fetched ${allWords.length} words...`)
  }

  // 只处理没有音标或没有例句的词
  const needsData = allWords.filter(w => !w.phonetic || !w.example)
  console.log(`Total: ${allWords.length}, need data: ${needsData.length}`)

  let updated = 0
  let failed = 0

  for (let i = 0; i < needsData.length; i++) {
    const w = needsData[i]
    try {
      const apiRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w.word)}`)
      if (!apiRes.ok) { failed++; continue }

      const entries = await apiRes.json()
      if (!Array.isArray(entries) || entries.length === 0) { failed++; continue }

      const entry = entries[0]
      let phonetic = w.phonetic
      let example = w.example

      // 提取音标
      if (!phonetic && entry.phonetics) {
        for (const p of entry.phonetics) {
          if (p.text) { phonetic = p.text; break }
        }
      }

      // 提取例句
      if (!example && entry.meanings) {
        for (const m of entry.meanings) {
          for (const d of m.definitions || []) {
            if (d.example) {
              example = d.example
              break
            }
          }
          if (example) break
        }
      }

      // 如果有新数据就更新
      if (phonetic !== w.phonetic || example !== w.example) {
        const update = {}
        if (!w.phonetic && phonetic) update.phonetic = phonetic
        if (!w.example && example) update.example = example

        if (Object.keys(update).length > 0) {
          const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/vocab_words?id=eq.${encodeURIComponent(w.id)}`, {
            method: 'PATCH',
            headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(update),
          })
          if (patchRes.ok) updated++
        }
      }
    } catch {
      failed++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  progress: ${i + 1}/${needsData.length} | updated: ${updated} | failed: ${failed}`)
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, DELAY))
  }

  console.log(`Done! Updated: ${updated}, Failed: ${failed}`)
}

main().catch(console.error)
