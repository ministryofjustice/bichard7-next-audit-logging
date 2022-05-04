import { AuditLogApiClient, logger } from "shared"
import getConfig from "./config"
import DatabaseClient from "./db"
import { addBichardRecordsToAuditLog } from "./addArchivalEvents"

export default async function addArchivalEvents(): Promise<void> {
  const config = getConfig()

  const db = new DatabaseClient(
    config.dbHost,
    config.dbUser,
    config.dbPassword,
    config.dbSsl,
    config.dbName,
    config.dbSchema,
    config.archiveGroupLimit
  )
  const auditLogApi = new AuditLogApiClient(config.apiUrl, config.apiKey)

  await db.connect()

  try {
    await db.markUnmarkedGroupsCompleted()
    await addBichardRecordsToAuditLog(db, auditLogApi)
  } catch (error) {
    logger.error(error as Error)
  } finally {
    db.disconnect()
  }
}
