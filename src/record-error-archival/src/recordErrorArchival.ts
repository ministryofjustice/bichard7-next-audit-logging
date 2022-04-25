import type { ApiClient } from "shared-types"
import { AuditLogEvent, isError, isSuccess } from "shared-types"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import type DatabaseClient from "./DatabaseClient"
import groupBy from "lodash.groupby"
import { logger } from "shared"

export type RecordErrorArchivalResult = {
  success: boolean
  reason?: string
  errorRecord: ArchivedErrorRecord
}

export const recordErrorArchival = async (db: DatabaseClient, api: ApiClient): Promise<RecordErrorArchivalResult[]> => {
  await db.connect()
  const errorRecords = await db.fetchUnloggedArchivedErrors()

  if (isError(errorRecords)) {
    throw errorRecords
  }

  const results: RecordErrorArchivalResult[] = []

  for (const errorRecord of errorRecords) {
    logger.debug({ message: "Would audit log the archival of an error", record: errorRecord })

    const auditLogEvent = new AuditLogEvent({
      eventSource: errorRecord.archivedBy,
      category: "information",
      eventType: "Error archival",
      timestamp: errorRecord.archivedAt
    })
    auditLogEvent.addAttribute("Error ID", errorRecord.errorId)

    const response = await api.createEvent(errorRecord.messageId, auditLogEvent)
    if (isError(response)) {
      logger.error({
        message: "Failed to add archived error to audit log",
        reason: response.message,
        record: errorRecord
      })
    }

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
      await db.markArchiveGroupAuditLogged(Number(archiveLogGroup))
    }
  }

  await db.disconnect()
  return results
}
