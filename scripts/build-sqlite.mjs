import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const schemaPath = join(root, 'schema.sql')
const outDir = join(root, 'public', 'data')
const outPath = join(outDir, 'kqasset_database.sqlite')
const wasmSrc = join(root, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const wasmDir = join(root, 'public', 'sql-wasm')

async function main() {
  // Ensure demo password hashes in schema match SHA-256 of README passwords
  let schema = readFileSync(schemaPath, 'utf-8')
  const pairs = [
    ['admin', 'Admin@2026'],
    ['asset_lead', 'Lead@2026'],
    ['officer', 'Work@2026'],
    ['leader', 'Leader@2026'],
  ]
  for (const [user, pass] of pairs) {
    const hash = createHash('sha256').update(pass).digest('hex')
    console.log(`${user} => ${hash}`)
  }

  const SQL = await initSqlJs()
  const db = new SQL.Database()
  db.exec(schema)
  // Overwrite password hashes to SHA-256 of demo passwords
  for (const [user, pass] of pairs) {
    const hash = createHash('sha256').update(pass).digest('hex')
    db.run('UPDATE kqasset_users SET password_hash = ? WHERE username = ?', [hash, user])
  }
  mkdirSync(outDir, { recursive: true })
  mkdirSync(wasmDir, { recursive: true })
  const data = db.export()
  writeFileSync(outPath, Buffer.from(data))
  copyFileSync(wasmSrc, join(wasmDir, 'sql-wasm.wasm'))
  db.close()
  console.log(`SQLite written: ${outPath} (${data.length} bytes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
