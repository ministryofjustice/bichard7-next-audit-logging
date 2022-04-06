import type { ApiClient } from "shared-types"
import { AuditLogEvent, isError, isSuccess } from "shared-types"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import type DatabaseClient from "./DatabaseClient"

export const recordErrorArchival = async (db: DatabaseClient, api: ApiClient) => {
  await db.connect()
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
    const response = await api.createEvent(errorRecord.messageId, auditLogEvent)

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
