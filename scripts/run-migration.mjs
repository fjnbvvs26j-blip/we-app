import pg from 'pg'
import fs from 'fs'

const { Client } = pg

const connStr = 'postgresql://postgres:kAvnem-marso3-gihdak@db.kcgkrgalxgaprkryzbhj.supabase.co:5432/postgres'

const client = new Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

async function run() {
  const sqlFile = process.argv[2]
  if (!sqlFile) {
    console.error('Usage: node run-migration.mjs <sql-file>')
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlFile, 'utf-8')

  try {
    await client.connect()
    console.log('Connected to Supabase.')
    await client.query(sql)
    console.log('Migration executed successfully.')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
