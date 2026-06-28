import { defineConfig } from 'drizzle-kit'

const defaultUrl = 'postgresql://tourenplan:tourenplan_dev@127.0.0.1:5432/tourenplan'

export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.NUXT_DATABASE_URL ?? defaultUrl,
  },
})
