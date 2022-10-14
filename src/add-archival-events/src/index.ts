import { AuditLogApiClient, logger } from "shared"
import AddArchivalEvents from "./addArchivalEvents"
import getConfig from "./config"
import { DatabaseClient } from "./db"

export default async function addArchivalEvents(): Promise<void> {
  const config = getConfig()

  const db = new DatabaseClient(
    config.dbHost,
    config.dbPort,
    config.dbUser,
    config.dbPassword,
    config.dbSsl,
    config.dbName,
    config.dbSchema,
    config.archiveGroupLimit
  )
  const auditLogApi = new AuditLogApiClient(config.apiUrl, config.apiKey)
  const addArchialEvents = new AddArchivalEvents(auditLogApi, db)

  await db.connect()

  try {
    await db.markUnmarkedGroupsCompleted()
    await addArchialEvents.addBichardRecordsToAuditLog()
  } catch (error) {
    logger.error(error as Error)
  } finally {
    db.disconnect()
  }
}
