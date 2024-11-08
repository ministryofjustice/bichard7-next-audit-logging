import { randomUUID } from "crypto"
import type {
  ApiAuditLogEvent,
  DynamoAuditLog,
  DynamoAuditLogEvent,
  DynamoAuditLogUserEvent,
  EventCategory,
  InputApiAuditLog,
  OutputApiAuditLog
} from "src/shared/types"
import { AuditLogStatus, PncStatus, TriggerStatus } from "src/shared/types"

export const mockInputApiAuditLog = (overrides: Partial<InputApiAuditLog> = {}): InputApiAuditLog => ({
  caseId: "Case ID",
  createdBy: "Create audit log test",
  externalCorrelationId: randomUUID(),
  externalId: randomUUID(),
  isSanitised: 0,
  messageHash: randomUUID(),
  messageId: randomUUID(),
  nextSanitiseCheck: new Date().toISOString(),
  receivedDate: new Date().toISOString(),
  s3Path: "2022/01/18/09/01/message.xml",
  stepExecutionId: randomUUID(),
  systemId: "System",
  ...overrides
})

export const mockOutputApiAuditLog = (overrides: Partial<OutputApiAuditLog> = {}): OutputApiAuditLog => ({
  ...mockInputApiAuditLog(overrides),
  pncStatus: PncStatus.Processing,
  triggerStatus: TriggerStatus.NoTriggers,
  status: AuditLogStatus.processing,
  events: [],
  ...overrides
})

export const mockDynamoAuditLog = (overrides: Partial<DynamoAuditLog> = {}): DynamoAuditLog => ({
  ...mockOutputApiAuditLog(overrides),
  events: [],
  eventsCount: 0,
  isSanitised: 0,
  version: 0,
  ...overrides
})

export const mockApiAuditLogEvent = (overrides: Partial<ApiAuditLogEvent> = {}): ApiAuditLogEvent => ({
  category: "information" as EventCategory,
  timestamp: new Date().toISOString(),
  eventCode: "dummy.event.code",
  eventType: "Test event",
  eventSource: "Test",
  eventSourceQueueName: "Test event source queue name",
  eventXml: "Test event xml".repeat(500),
  attributes: {
    "Attribute 1": "Attribute 1 data".repeat(500),
    "Attribute 2": "Attribute 2 data"
  },
  ...overrides
})

export const mockDynamoAuditLogEvent = (
  overrides: Partial<DynamoAuditLogEvent & { _id?: string }> = {}
): DynamoAuditLogEvent => ({
  ...mockApiAuditLogEvent(overrides),
  _automationReport: 0,
  _topExceptionsReport: 0,
  _messageId: "needs-setting",
  ...overrides
})

export const mockDynamoAuditLogUserEvent = (overrides: Partial<DynamoAuditLogEvent> = {}): DynamoAuditLogUserEvent => ({
  ...mockApiAuditLogEvent(overrides),
  _automationReport: 0,
  _topExceptionsReport: 0,
  user: "needs-string",
  ...overrides
})
