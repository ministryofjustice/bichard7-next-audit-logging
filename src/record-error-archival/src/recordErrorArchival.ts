import { AuditLogApiClient } from "shared"
import { AuditLogEvent, isError, isSuccess } from "shared-types"
import config from "./config"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import DatabaseClient from "./DatabaseClient"

export const recordErrorArchival = async () => {
  const db = new DatabaseClient(config.dbHost, config.dbUser, config.dbPassword, config.dbName, config.dbSchema)
  await db.connect()

  const auditLogApi = new AuditLogApiClient(config.apiUrl, config.apiKey)

  const errorRecords = await db.fetchUnloggedArchivedErrors()

  const results: { success: boolean; reason?: string; errorRecord: ArchivedErrorRecord }[] = []

  for (const errorRecord of errorRecords) {
    console.log(
      `Would audit log the archival of error ${errorRecord.errorId} on message ${errorRecord.messageId} at ${errorRecord.archivedAt} by ${errorRecord.archivedBy}`
    )

    const auditLogEvent = new AuditLogEvent({
      eventSource: errorRecord.archivedBy,
      category: "information",
      eventType: "Error archival",
      timestamp: errorRecord.archivedAt
    })
    auditLogEvent.addAttribute("Error ID", errorRecord.errorId)
    const response = await auditLogApi.createEvent(errorRecord.messageId, auditLogEvent)

    results.push({
      success: isSuccess(response),
      reason: isError(response) ? response.message : undefined,
      errorRecord: errorRecord
    })
  }

  // TODO mark archive log as audit logged when all have succeeded

  await db.disconnect()
  return results
}
