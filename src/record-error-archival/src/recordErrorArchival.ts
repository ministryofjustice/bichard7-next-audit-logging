import groupBy from "lodash.groupby"
import { logger } from "shared"
import type { ApiClient, AuditLog } from "shared-types"
import { AuditLogEvent, isError, isSuccess } from "shared-types"
import type DatabaseClient from "./DatabaseClient"
import type { ArchivedErrorRecord } from "./DatabaseClient"

export type RecordErrorArchivalResult = {
  success: boolean
  reason?: string
  errors: Error[]
  errorRecord: ArchivedErrorRecord
}

const archivalEventType = "Error archival"
const archivalEventCategory = "information"

const hasArchivalEvent = (auditLog: AuditLog, errorId: number): boolean =>
  auditLog.events.filter((event) => {
    return (
      event.eventType === archivalEventType &&
      event.category === archivalEventCategory &&
      (event.attributes["Error ID"] || "") === errorId
    )
  }).length > 0

export const recordErrorArchival = async (db: DatabaseClient, api: ApiClient): Promise<RecordErrorArchivalResult[]> => {
  await db.connect()
  const errorRecords = await db.fetchUnloggedArchivedErrors()

  if (isError(errorRecords)) {
    throw errorRecords
  }

  const results: RecordErrorArchivalResult[] = []

  for (const errorRecord of errorRecords) {
    const result: RecordErrorArchivalResult = {
      success: false,
      errors: [],
      errorRecord: errorRecord
    }

    const messageResult = await api.getMessage(errorRecord.messageId)

    if (isError(messageResult)) {
      result.success = false
      result.reason = "Failed to retrieve message from audit log API"
      result.errors.push(messageResult)

      logger.error({ message: result.reason, record: errorRecord })

      results.push(result)
      continue
    }

    if (hasArchivalEvent(messageResult, errorRecord.errorId)) {
      logger.debug({ message: "Message already has archival event", record: errorRecord })

      result.success = true
      results.push(result)
      continue
    }

    const auditLogEvent = new AuditLogEvent({
      eventSource: errorRecord.archivedBy,
      category: archivalEventCategory,
      eventType: archivalEventType,
      timestamp: errorRecord.archivedAt
    })
    auditLogEvent.addAttribute("Error ID", errorRecord.errorId)

    logger.debug({ message: "Would audit log the archival of an error", record: errorRecord })

    const response = await api.createEvent(errorRecord.messageId, auditLogEvent)
    if (isError(response)) {
      logger.error({
        message: "Failed to add archived error to audit log",
        reason: response.message,
        record: errorRecord
      })
    }

    result.success = isSuccess(response)
    if (isError(response)) {
      result.reason = "Audit log API failure"
      result.errors.push(response)
    }
    results.push(result)
  }

  // Mark successfully audit logged errors
  const successful = results.filter((result) => result.success).map((result) => result.errorRecord.errorId)
  if (successful.length > 0) {
    const dbResult = await db.markErrorsAuditLogged(successful)

    if (isError(dbResult)) {
      results
        .filter((result) => result.success)
        .map((result) => {
          result.success = false
          result.reason = "Failed database update: successfully audit logged individual record"
          result.errors.push(dbResult)
        })
    }
  }

  // Record failed attempts to audit log
  const failed = results.filter((result) => !result.success).map((result) => result.errorRecord.errorId)
  if (failed.length > 0) {
    const dbResult = await db.markErrorsAuditLogFailed(failed)

    if (isError(dbResult)) {
      results
        .filter((result) => !result.success)
        .map((result) => {
          result.success = false
          result.reason = "Failed database update: unsuccessfully audit logged individual record"
          result.errors.push(dbResult)
        })
    }
  }

  // Mark groups with no failed updates as complete
  const groupedResults = groupBy(results, (result) => result.errorRecord.archiveLogId)
  for (const [archiveLogGroup, groupResults] of Object.entries(groupedResults)) {
    if (groupResults.filter((result) => !result.success).length < 1) {
      const dbResult = await db.markArchiveGroupAuditLogged(Number(archiveLogGroup))

      if (isError(dbResult)) {
        groupResults.map((result) => {
          result.success = false
          result.reason = "Failed database update: successfully audit logged archive group"
          result.errors.push(dbResult)
        })
      }
    }
  }

  await db.disconnect()
  return results
}
