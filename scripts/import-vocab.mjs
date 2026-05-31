import fs from 'fs'
import csv from 'csv-parser'

const SUPABASE_URL = 'https://kcgkrgalxgparkryzbhj.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjZ2tyZ2FseGdwYXJrcnl6YmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNDM3ODUsImV4cCI6MjA5NTcxOTc4NX0.CP_FsR87K76MN42NGXXPfZAuMcMp_4A80833KBgsyMQ'

async function main() {
  const words = []

  // Parse CSV
  const content = fs.readFileSync('/tmp/vocab.csv', 'utf-8')
  const lines = content.split('\n')

  let current = null
  for (const line of lines) {
    if (!line.trim()) continue

    if (current === null) {
      // Check if this line starts a new entry or is a continuation
      if (line.includes(',') && !line.startsWith(' ') && !line.startsWith('\t')) {
        // It's a new entry
        const idx = line.indexOf(',')
        const word = line.substring(0, idx).trim()
        const meaning = line.substring(idx + 1).trim()
        if (word && /^[a-zA-Z-]+$/.test(word) && word.length > 1) {
          if (current) words.push(current)
          current = { word: word.toLowerCase(), meaning }
        }
      }
    } else {
      // Continuation of previous meaning
      current.meaning += ' ' + line.trim()
    }
  }
  if (current) words.push(current)

  // Remove duplicates
  const seen = new Set()
  const unique = words.filter(w => {
    if (seen.has(w.word)) return false
    seen.add(w.word)
    return true
  })

  console.log(`Parsed ${unique.length} unique words`)

  // Batch insert
  const BATCH = 500
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)
    const rows = batch.map((w, j) => ({
      word: w.word,
      meaning: w.meaning,
      list_number: Math.floor(i / BATCH) + 1,
      frequency: 'high',
      id: crypto.randomUUID(),
    }))

    const res = await fetch(`${SUPABASE_URL}/rest/v1/vocab_words`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(rows),
    })

    if (!res.ok) {
      console.error(`Batch ${i / BATCH + 1} failed:`, await res.text())
      process.exit(1)
    }
    console.log(`Batch ${i / BATCH + 1}: inserted ${rows.length} words`)
  }

  console.log('Done!')
}

main().catch(console.error)
