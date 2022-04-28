import { logger } from "shared"
import type { ApiClient, AuditLog } from "shared-types"
import { AuditLogEvent, isError } from "shared-types"
import type { ArchivedErrorRecord } from "./DatabaseClient"

const ARCHIVAL_EVENT_TYPE = "Error archival"
const ARCHIVAL_EVENT_CATAGORY = "information"

const hasArchivalEvent = (auditLog: AuditLog, errorId: number): boolean =>
  auditLog.events.filter((event) => {
    return (
      event.eventType === ARCHIVAL_EVENT_TYPE &&
      event.category === ARCHIVAL_EVENT_CATAGORY &&
      (event.attributes["Error ID"] || "") === errorId
    )
  }).length > 0

export const isRecordInAuditLog = async (
  api: ApiClient,
  errorRecord: ArchivedErrorRecord
): Promise<{ exists: boolean; err: boolean }> => {
  logger.debug({ message: "Retreiving message from audit log", record: errorRecord })
  const messageResult = await api.getMessage(errorRecord.messageId)
  if (isError(messageResult)) {
    logger.error({
      message: "Failed to retrieve message from audit log API",
      reason: messageResult.message,
      record: errorRecord
    })
    return { exists: false, err: true }
  }

  return { exists: hasArchivalEvent(messageResult, errorRecord.errorId), err: false }
}

export const createArchivalEventInAuditLog = async (
  api: ApiClient,
  errorRecord: ArchivedErrorRecord
): Promise<boolean> => {
  const auditLogEvent = new AuditLogEvent({
    eventSource: errorRecord.archivedBy,
    category: ARCHIVAL_EVENT_CATAGORY,
    eventType: ARCHIVAL_EVENT_TYPE,
    timestamp: errorRecord.archivedAt
  })
  auditLogEvent.addAttribute("Error ID", errorRecord.errorId)

  logger.debug({ message: "Audit logging the archival of an error", record: errorRecord })
  const response = await api.createEvent(errorRecord.messageId, auditLogEvent)

  if (isError(response)) {
    logger.error({
      message: "Failed to mark archived of error to audit log",
      reason: response.message,
      record: errorRecord
    })
    return true
  }

  return isError(response)
}
