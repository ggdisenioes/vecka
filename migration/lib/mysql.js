import mysql from 'mysql2/promise'
import { migrationConfig } from './config.js'

export async function getMysqlConnection() {
  return mysql.createConnection({
    ...(migrationConfig.mysql.socketPath
      ? { socketPath: migrationConfig.mysql.socketPath }
      : {
          host: migrationConfig.mysql.host,
          port: migrationConfig.mysql.port,
        }),
    user: migrationConfig.mysql.user,
    password: migrationConfig.mysql.password,
    database: migrationConfig.mysql.database,
    charset: 'utf8mb4',
  })
}
