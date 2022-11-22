import { logger } from "src/shared"
import { mockApiAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent, ApiClient, InputApiAuditLog, OutputApiAuditLog } from "src/shared/types"
import { EventCode, isError } from "src/shared/types"
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
    const auditLogEvent = mockApiAuditLogEvent({
      eventSource: bichardRecord.archivedBy,
      category: "information",
      eventType: "Error record archival",
      eventCode: EventCode.ErrorRecordArchived,
      timestamp: bichardRecord.archivedAt.toISOString(),
      attributes: { "Record ID": bichardRecord.recordId }
    })

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
    const message: InputApiAuditLog = {
      caseId: "Unknown",
      createdBy: "Add Archival Events",
      externalCorrelationId: messageId,
      isSanitised: 0,
      messageHash: messageId,
      messageId,
      receivedDate: archivedAt.toISOString()
    }

    const createEventResult = await this.api.createAuditLog(message)
    if (isError(createEventResult)) {
      logger.error({ message: "Failed to create audit log for record", messageId: messageId })
    }

    return isError(createEventResult)
  }

  private hasArchivalEvent = (auditLog: OutputApiAuditLog, recordId: number): boolean =>
    auditLog.events.filter((event: ApiAuditLogEvent) => {
      return (
        event.eventCode === EventCode.ErrorRecordArchived &&
        event.category === "information" &&
        (event.attributes?.["Record ID"] || "") === recordId
      )
    }).length > 0
}
