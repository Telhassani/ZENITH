import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initDb() {
  const dbPath = resolve(process.cwd(), 'server', 'zenith.db')
  db = new Database(dbPath)

  // Enable WAL mode
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run schema
  const schemaPath = resolve(__dirname, 'schema.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)

  console.log('SQLite initialized (WAL mode)')
}
