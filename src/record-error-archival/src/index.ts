import { recordErrorArchival } from "./recordErrorArchival"
import getConfig from "./config"
import DatabaseClient from "./DatabaseClient"
import { AuditLogApiClient } from "shared"
import { logger } from "shared"

export default async function doRecordErrorArchival(): Promise<void> {
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

  try {
    const statuses = await recordErrorArchival(db, auditLogApi)
    const successfulRecords = statuses?.filter((record) => record.success).length ?? 0
    logger.info({
      message: `Successfully updated ${successfulRecords} records`,
      successfulRecords: successfulRecords
    })

    const failedRecords = statuses?.filter((record) => !record.success)

    if (failedRecords !== undefined && failedRecords.length > 0) {
      logger.error({ message: "Failed to audit log some archived errors", failedRecords: failedRecords })
    }
    return
  } catch (error) {
    db.disconnect()
    throw error
  }
}
