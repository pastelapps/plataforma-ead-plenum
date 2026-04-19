#!/usr/bin/env node
/**
 * Script to run migration 003_ead_schema.sql on Supabase
 * via Management API (database/query endpoint)
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_ffb4dea7329216dd37bb0b6baa4c75b91edeadd3'
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'jyackmnjhsdllfqqxund'
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

async function runSQL(sql, label) {
  console.log(`\n=== ${label} ===`)
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`ERRO (${res.status}):`, text)
    return false
  }

  // Check for postgres errors in the response
  try {
    const data = JSON.parse(text)
    if (data && typeof data === 'object' && data.error) {
      console.error('SQL Error:', data.error)
      return false
    }
  } catch {}

  console.log('OK')
  return true
}

// Read the full migration
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '003_ead_schema.sql')
const fullSQL = readFileSync(migrationPath, 'utf8')

// Split into logical blocks at the separator comments
const blocks = []
let current = ''
let currentLabel = 'Init'

for (const line of fullSQL.split('\n')) {
  if (line.startsWith('-- =====') && current.trim()) {
    blocks.push({ sql: current, label: currentLabel })
    current = ''
  }
  if (line.startsWith('-- ') && !line.startsWith('-- =====') && line.length > 5 && !line.includes('campo')) {
    currentLabel = line.replace(/^-- /, '').trim()
  }
  current += line + '\n'
}
if (current.trim()) {
  blocks.push({ sql: current, label: currentLabel })
}

// Merge blocks into reasonable chunks (max ~50 statements per chunk)
// Actually, just send the whole thing as one query - Management API can handle it
console.log(`Migration has ${blocks.length} blocks`)
console.log('Running full migration...')

const success = await runSQL(fullSQL, 'Full migration 003_ead_schema.sql')
if (success) {
  console.log('\n✅ Migration completed successfully!')
} else {
  console.log('\n❌ Migration failed. Trying block by block...')

  for (let i = 0; i < blocks.length; i++) {
    const ok = await runSQL(blocks[i].sql, `Block ${i+1}/${blocks.length}: ${blocks[i].label}`)
    if (!ok) {
      console.error(`Failed at block ${i+1}. Stopping.`)
      process.exit(1)
    }
  }
  console.log('\n✅ All blocks completed successfully!')
}
