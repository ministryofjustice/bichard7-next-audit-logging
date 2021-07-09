import AuditLogEvent from "../types/AuditLogEvent"
import AuditLogStatus from "../types/AuditLogStatus"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  expectedStatus: string
  expectedEventType?: string
}

test.each<TestInput>([
  { eventType: "PNC Response received", expectedStatus: AuditLogStatus.completed },
  { eventType: "PNC Response not received", expectedStatus: AuditLogStatus.error },
  { eventType: "Other event types", expectedStatus: AuditLogStatus.processing }
])("returns <$expected/> when eventType is $eventType", ({ eventType, expectedStatus }) => {
  const auditLogEvent = new AuditLogEvent({
    category: "information",
    timestamp: new Date(),
    eventType,
    eventSource: "Test"
  })

  const actualStatus = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
})
