import type {
  ApiAuditLogEvent,
  DynamoAuditLog,
  DynamoAuditLogEvent,
  EventCategory,
  InputApiAuditLog,
  OutputApiAuditLog
} from "src/shared/types"
import { AuditLogStatus, PncStatus, TriggerStatus } from "src/shared/types"
import { v4 as uuid } from "uuid"

export const mockInputApiAuditLog = (overrides: Partial<InputApiAuditLog> = {}): InputApiAuditLog => ({
  caseId: "Case ID",
  createdBy: "Create audit log test",
  externalCorrelationId: uuid(),
  externalId: uuid(),
  isSanitised: 0,
  messageHash: uuid(),
  messageId: uuid(),
  nextSanitiseCheck: new Date().toISOString(),
  receivedDate: new Date().toISOString(),
  s3Path: "2022/01/18/09/01/message.xml",
  stepExecutionId: uuid(),
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

export const mockDynamoAuditLogEvent = (overrides: Partial<DynamoAuditLogEvent> = {}): DynamoAuditLogEvent => ({
  ...mockApiAuditLogEvent(overrides),
  _automationReport: 0,
  _topExceptionsReport: 0,
  _messageId: "needs-setting",
  ...overrides
})
