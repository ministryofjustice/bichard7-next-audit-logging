import type { EventCategory } from "../types"
import { AuditLogEvent, AuditLogStatus } from "../types"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  category: EventCategory
  expectedStatus: string
  expectedEventType?: string
}

test.each<TestInput>([
  { eventType: "PNC Response received", category: "information", expectedStatus: AuditLogStatus.completed },
  { eventType: "PNC Response not received", category: "error", expectedStatus: AuditLogStatus.error },
  { eventType: "Other event types", category: "information", expectedStatus: AuditLogStatus.processing }
])("returns <$expected/> when eventType is $eventType", ({ eventType, category, expectedStatus }) => {
  const auditLogEvent = new AuditLogEvent({
    category,
    timestamp: new Date(),
    eventType,
    eventSource: "Test"
  })

  const actualStatus = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
})
