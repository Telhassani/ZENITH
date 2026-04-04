import { Database } from 'bun:sqlite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let db: Database

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDb() {
  const dbPath = resolve(process.cwd(), 'server', 'zenith.db')
  db = new Database(dbPath)

  // Enable WAL mode
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  // Run schema
  const schemaPath = resolve(import.meta.dir, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)

  console.log('SQLite initialized (WAL mode)')
}
