import mysql from 'mysql2/promise'
import { migrationConfig } from './config.js'

export async function getMysqlConnection() {
  const baseOptions = {
    user: migrationConfig.mysql.user,
    password: migrationConfig.mysql.password,
    database: migrationConfig.mysql.database,
    charset: 'utf8mb4',
  }

  if (migrationConfig.mysql.socketPath) {
    try {
      return await mysql.createConnection({
        ...baseOptions,
        socketPath: migrationConfig.mysql.socketPath,
      })
    } catch (error) {
      if (error?.code !== 'EPERM' && error?.code !== 'ENOENT' && error?.code !== 'ECONNREFUSED') {
        throw error
      }
    }
  }

  return mysql.createConnection({
    ...baseOptions,
    host: migrationConfig.mysql.host,
    port: migrationConfig.mysql.port,
  })
}
