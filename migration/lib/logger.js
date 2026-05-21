import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { migrationConfig } from './config.js'

export function createMigrationLogger(scriptName) {
  const logsDir = path.join(migrationConfig.rootDir, 'migration', 'logs')
  mkdirSync(logsDir, { recursive: true })

  const logFile = path.join(logsDir, `${scriptName}.log`)

  function write(level, message, extra = null) {
    const line = [
      new Date().toISOString(),
      level.toUpperCase(),
      message,
      extra ? JSON.stringify(extra) : '',
    ]
      .filter(Boolean)
      .join(' | ')

    appendFileSync(logFile, `${line}\n`, 'utf8')
    console.log(line)
  }

  return {
    info(message, extra) {
      write('info', message, extra)
    },
    warn(message, extra) {
      write('warn', message, extra)
    },
    error(message, extra) {
      write('error', message, extra)
    },
    logFile,
  }
}
