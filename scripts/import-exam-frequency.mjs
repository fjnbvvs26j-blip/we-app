// 从 NETEMVocabulary 导入考研真题词频到 metadata.exam_frequency
// 用法: node scripts/import-exam-frequency.mjs

import fs from 'fs'

const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZ2tyZ2FseGdwYXJrcnl6YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODUsImV4cCI6MjA5NTcxOTc4NX0.CP_FsR87K76MN42NGXXPfZAuMcMp_4A80833KBgsyMQ'

async function main() {
  const raw = fs.readFileSync('/tmp/netem_full_list.json', 'utf-8')
  const netem = JSON.parse(raw)['5530考研词汇词频排序表']
  console.log(`NETEM entries: ${netem.length}`)

  const freqMap = new Map()
  for (const entry of netem) {
    const word = entry['单词'].toLowerCase().trim()
    const freq = entry['词频']
    freqMap.set(word, freq)
    if (entry['其他拼写']) {
      for (const alt of entry['其他拼写'].split(/[,，]/)) {
        const altWord = alt.trim().toLowerCase()
        if (altWord && !freqMap.has(altWord)) {
          freqMap.set(altWord, freq)
        }
      }
    }
  }
  console.log(`Unique word mappings: ${freqMap.size}`)

  // 获取所有单词及其当前 metadata
  let allWords = []
  let offset = 0
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vocab_words?select=id,word,metadata&limit=1000&offset=${offset}`,
      { headers: { 'apikey': ANON_KEY } }
    )
    const batch = await res.json()
    if (!batch || batch.length === 0) break
    allWords = allWords.concat(batch)
    offset += 1000
  }
  console.log(`Our words: ${allWords.length}`)

  let done = 0
  let matched = 0
  let failed = 0

  for (const w of allWords) {
    const freq = freqMap.get(w.word.toLowerCase())
    if (freq === undefined) continue
    matched++

    const meta = { ...(w.metadata || {}), exam_frequency: freq }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vocab_words?id=eq.${encodeURIComponent(w.id)}`,
      {
        method: 'PATCH',
        headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ metadata: meta }),
      }
    )
    if (res.ok) done++
    else failed++

    if ((done + failed) % 500 === 0) {
      console.log(`  progress: ${done + failed}/${matched} | done: ${done} | failed: ${failed}`)
    }
  }

  console.log(`Done! Matched: ${matched}, Updated: ${done}, Failed: ${failed}`)
}

main().catch(console.error)
