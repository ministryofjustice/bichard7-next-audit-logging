import { ApiAuditLogEvent, DynamoAuditLog, DynamoAuditLogEvent, OutputApiAuditLog } from "src/shared/types"

const convertDynamoAuditLogEventToApi = (event: DynamoAuditLogEvent): ApiAuditLogEvent => ({
  attributes: event.attributes,
  category: event.category,
  eventCode: event.eventCode,
  eventSource: event.eventSource,
  eventSourceQueueName: event.eventSourceQueueName,
  eventType: event.eventType,
  eventXml: event.eventXml,
  timestamp: event.timestamp,
  user: event.user
})

const convertDynamoAuditLogToOutputApi = (auditLog: DynamoAuditLog): OutputApiAuditLog => ({
  caseId: auditLog.caseId,
  createdBy: auditLog.createdBy,
  events: auditLog.events.map(convertDynamoAuditLogEventToApi),
  externalCorrelationId: auditLog.externalCorrelationId,
  externalId: auditLog.externalId,
  forceOwner: auditLog.forceOwner,
  isSanitised: auditLog.isSanitised,
  messageHash: auditLog.messageHash,
  messageId: auditLog.messageId,
  nextSanitiseCheck: auditLog.nextSanitiseCheck,
  pncStatus: auditLog.pncStatus,
  receivedDate: auditLog.receivedDate,
  s3Path: auditLog.s3Path,
  status: auditLog.status,
  stepExecutionId: auditLog.stepExecutionId,
  systemId: auditLog.systemId,
  triggerStatus: auditLog.triggerStatus
})

export default convertDynamoAuditLogToOutputApi
