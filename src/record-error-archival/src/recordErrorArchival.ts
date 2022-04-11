import type { ApiClient } from "shared-types"
import { AuditLogEvent, isError, isSuccess } from "shared-types"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import type DatabaseClient from "./DatabaseClient"
import groupBy from "lodash.groupby"

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

  // Mark successfully audit logged errors
  const successful = results.filter((result) => result.success).map((result) => result.errorRecord.errorId)
  if (successful.length > 0) {
    await db.markErrorsAuditLogged(successful)
  }

  // Record failed attempts to audit log
  const failed = results.filter((result) => !result.success).map((result) => result.errorRecord.errorId)
  if (failed.length > 0) {
    await db.markErrorsAuditLogFailed(failed)
  }

  // Mark groups with no failed updates as complete
  const groupedResults = groupBy(results, (result) => result.errorRecord.archiveLogId)
  for (const [archiveLogGroup, groupResults] of Object.entries(groupedResults)) {
    if (groupResults.filter((result) => !result.success).length < 1) {
      await db.markArchiveGroupAuditLogged(BigInt(archiveLogGroup))
    }
  }

  await db.disconnect()
  return results
}
