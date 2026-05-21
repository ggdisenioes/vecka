import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadLocalEnv } from './load-env.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(currentDir, '../..')

loadLocalEnv(rootDir)

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export const migrationConfig = {
  rootDir,
  mysql: {
    host: process.env.MIGRATION_WP_DB_HOST || '127.0.0.1',
    port: Number(process.env.MIGRATION_WP_DB_PORT || 3306),
    socketPath: process.env.MIGRATION_WP_DB_SOCKET || '',
    user: requireEnv('MIGRATION_WP_DB_USER'),
    password: process.env.MIGRATION_WP_DB_PASSWORD || '',
    database: requireEnv('MIGRATION_WP_DB_NAME'),
  },
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
}
