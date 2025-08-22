import { AuditLogApiClient, logger } from "src/shared"
import AddArchivalEvents from "./addArchivalEvents"
import getConfig from "./config"
import { DatabaseClient } from "./db"
import { SSM } from "aws-sdk"

const ssm = new SSM()

export default async function addArchivalEvents(): Promise<void> {
  const config = await getConfig(ssm)

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
  const addEvents = new AddArchivalEvents(auditLogApi, db)

  await db.connect()

  try {
    await db.markUnmarkedGroupsCompleted()
    await addEvents.addBichardRecordsToAuditLog()
  } catch (error) {
    logger.error(error as Error)
  } finally {
    db.disconnect()
  }
}
