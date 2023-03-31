import { EventCode, isError } from "src/shared/types"
import type { ApiClient, InputApiAuditLog, ApiAuditLogEvent, PromiseResult } from "src/shared/types"

export default class CreateDuplicateMessageEvent {
  constructor(private apiClient: ApiClient) {}

  async execute(auditLog: InputApiAuditLog): PromiseResult<void> {
    const existingAuditLog = await this.apiClient.getMessageByHash(auditLog.messageHash, {
      excludeColumns: [
        "caseId",
        "events",
        "externalCorrelationId",
        "externalId",
        "forceOwner",
        "lastEventType",
        "receivedDate",
        "s3Path",
        "pncStatus",
        "triggerStatus",
        "systemId"
      ]
    })

    if (isError(existingAuditLog)) {
      return existingAuditLog
    }

    if (!existingAuditLog) {
      return Error(`Error creating event: A message with hash ${auditLog.messageHash} does not exist in the database`)
    }

    const attributes = {
      s3Path: auditLog.s3Path ?? "unknown",
      receivedDate: auditLog.receivedDate,
      externalId: auditLog.externalId ?? "unknown",
      externalCorrelationId: auditLog.externalCorrelationId,
      stepExecutionId: auditLog.stepExecutionId ?? "unknown"
    }

    const event: ApiAuditLogEvent = {
      attributes,
      category: "information",
      eventCode: EventCode.DuplicateMessage,
      eventSource: "Incoming Message Handler",
      eventType: "Duplicate message",
      timestamp: new Date().toISOString()
    }

    return this.apiClient.createEvent(existingAuditLog.messageId, event)
  }
}
