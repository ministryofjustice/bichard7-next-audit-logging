import { logger } from "shared"
import type { ApiClient, AuditLog } from "shared-types"
import { AuditLogEvent, isError } from "shared-types"
import type { BichardRecord } from "./db"

const ARCHIVAL_EVENT_TYPE = "Error record archival"
const ARCHIVAL_EVENT_CATAGORY = "information"

const hasArchivalEvent = (auditLog: AuditLog, recordId: number): boolean =>
  auditLog.events.filter((event) => {
    return (
      event.eventType === ARCHIVAL_EVENT_TYPE &&
      event.category === ARCHIVAL_EVENT_CATAGORY &&
      (event.attributes["Record ID"] || "") === recordId
    )
  }).length > 0

export const isRecordInAuditLog = async (
  api: ApiClient,
  bichardRecord: BichardRecord
): Promise<{ exists: boolean; err: boolean }> => {
  logger.debug({ message: "Retreiving message from audit log", record: bichardRecord })
  const messageResult = await api.getMessage(bichardRecord.messageId)
  if (isError(messageResult)) {
    logger.error({
      message: "Failed to retrieve message from audit log API",
      reason: messageResult.message,
      record: bichardRecord
    })
    return { exists: false, err: true }
  }

  return { exists: hasArchivalEvent(messageResult, bichardRecord.recordId), err: false }
}

export const createArchivalEventInAuditLog = async (api: ApiClient, bichardRecord: BichardRecord): Promise<boolean> => {
  const auditLogEvent = new AuditLogEvent({
    eventSource: bichardRecord.archivedBy,
    category: ARCHIVAL_EVENT_CATAGORY,
    eventType: ARCHIVAL_EVENT_TYPE,
    timestamp: bichardRecord.archivedAt
  })
  auditLogEvent.addAttribute("Record ID", bichardRecord.recordId)

  logger.debug({ message: "Audit logging the archival of an error record", record: bichardRecord })
  const response = await api.createEvent(bichardRecord.messageId, auditLogEvent)

  if (isError(response)) {
    logger.error({
      message: "Failed to mark archived of error to audit log",
      reason: response.message,
      record: bichardRecord
    })
    return true
  }

  return isError(response)
}
