import AuditLogEvent from "src/AuditLogEvent"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  expectedStatus: string
}

test.each<TestInput>([
  { eventType: "PNC Response received", expectedStatus: "Completed" },
  { eventType: "PNC Response not received", expectedStatus: "PNC Response not received" },
  { eventType: "Other event types", expectedStatus: "Processing" }
])("returns <$expected/> when eventType is $eventType", ({ eventType, expectedStatus }) => {
  const auditLogEvent = new AuditLogEvent("information", new Date(), eventType)
  const actualStatus = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
})
