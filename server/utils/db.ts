import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../database/schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let dbInstance: DrizzleDb | null = null
let initPromise: Promise<{ db: DrizzleDb }> | null = null

function getConnectionString(): string {
  try {
    const config = useRuntimeConfig()
    const url = config.databaseUrl as string
    if (url?.trim()) return url.trim()
  } catch {
    /* outside Nitro */
  }
  const fallback = process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL
  if (fallback?.trim()) return fallback.trim()
  throw new Error('Database URL missing: set NUXT_DATABASE_URL')
}

export async function useDb(): Promise<{ db: DrizzleDb }> {
  if (dbInstance) {
    return { db: dbInstance }
  }
  if (!initPromise) {
    initPromise = (async () => {
      const connectionString = getConnectionString()
      const sql = postgres(connectionString, { max: 10 })
      const d = drizzle(sql, { schema })
      await migrate(d, {
        migrationsFolder: join(process.cwd(), 'server/database/migrations'),
      })
      dbInstance = d
      return { db: dbInstance }
    })()
  }
  return initPromise
}
