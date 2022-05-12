import { logger } from "shared"
import type { ApiClient } from "shared-types"
import { AuditLog, AuditLogEvent, isError, EventType } from "shared-types"
import type { BichardRecord } from "./db"

export default class ArchivalEventsApiClient {
  constructor(private api: ApiClient) {}

  public isRecordInAuditLog = async (bichardRecord: BichardRecord): Promise<{ exists: boolean; err: boolean }> => {
    logger.debug({ message: "Retreiving message from audit log", record: bichardRecord })
    const messageResult = await this.api.getMessage(bichardRecord.messageId)

    if (isError(messageResult)) {
      logger.error({
        message: "Failed to retrieve message from audit log API",
        reason: messageResult.message,
        record: bichardRecord
      })
      return { exists: false, err: true }
    }

    // Create audit log message if one does not already exist
    if (!messageResult) {
      const err = await this.createAuditLog(bichardRecord.messageId, bichardRecord.archivedAt)
      if (err) {
        logger.error({ message: "Failed to create audit log for record", messageId: bichardRecord.messageId })
      }
      return { exists: false, err }
    }

    return { exists: this.hasArchivalEvent(messageResult, bichardRecord.recordId), err: false }
  }

  public createArchivalEventInAuditLog = async (bichardRecord: BichardRecord): Promise<boolean> => {
    const auditLogEvent = new AuditLogEvent({
      eventSource: bichardRecord.archivedBy,
      category: "information",
      eventType: EventType.ErrorRecordArchival,
      timestamp: bichardRecord.archivedAt
    })
    auditLogEvent.addAttribute("Record ID", bichardRecord.recordId)

    logger.debug({ message: "Audit logging the archival of an error record", record: bichardRecord })
    const response = await this.api.createEvent(bichardRecord.messageId, auditLogEvent)

    if (isError(response)) {
      logger.error({
        message: "Error marking record as archived in audit log",
        reason: response.message,
        record: bichardRecord
      })
      return true
    }

    return isError(response)
  }

  private createAuditLog = async (messageId: string, archivedAt: Date): Promise<boolean> => {
    const message = {
      ...new AuditLog(messageId, archivedAt, messageId, messageId), // We don't have the message XML to compute the message hash
      messageId,
      caseId: "Unknown",
      createdBy: "Add Archival Events"
    }
    const createEventResult = await this.api.createAuditLog(message)
    if (isError(createEventResult)) {
      logger.error({ message: "Failed to create audit log for record", messageId: messageId })
    }

    return isError(createEventResult)
  }

  private hasArchivalEvent = (auditLog: AuditLog, recordId: number): boolean =>
    auditLog.events.filter((event: AuditLogEvent) => {
      return (
        event.eventType === EventType.ErrorRecordArchival &&
        event.category === "information" &&
        (event.attributes["Record ID"] || "") === recordId
      )
    }).length > 0
}
