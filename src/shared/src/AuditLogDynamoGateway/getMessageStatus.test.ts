import type { EventCategory } from "shared-types"
import { AuditLogEvent, AuditLogStatus } from "shared-types"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  category: EventCategory
  expectedStatus: string | null
  expectedEventType?: string
}

test.each<TestInput>([
  { eventType: "PNC Update applied successfully", category: "information", expectedStatus: AuditLogStatus.completed },
  {
    eventType: "Hearing Outcome ignored as it contains no offences",
    category: "information",
    expectedStatus: AuditLogStatus.completed
  },
  {
    eventType: "Hearing Outcome ignored as no offences are recordable",
    category: "information",
    expectedStatus: AuditLogStatus.completed
  },
  { eventType: "PNC Response not received", category: "error", expectedStatus: AuditLogStatus.error },
  { eventType: "Retrying failed message", category: "information", expectedStatus: AuditLogStatus.retrying },
  { eventType: "Message Sent to Bichard", category: "information", expectedStatus: AuditLogStatus.processing },
  {
    eventType: "Hearing Outcome passed to Error List",
    category: "information",
    expectedStatus: AuditLogStatus.processing
  },
  { eventType: "Record archived", category: "information", expectedStatus: AuditLogStatus.archived },
  { eventType: "Other event types", category: "information", expectedStatus: null }
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
