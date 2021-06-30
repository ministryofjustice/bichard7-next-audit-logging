import AuditLogEvent from "src/AuditLogEvent"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  expectedStatus: string
  expectedErrorMessage?: string
}

test.each<TestInput>([
  { eventType: "PNC Response received", expectedStatus: "Completed", expectedErrorMessage: undefined },
  {
    eventType: "PNC Response not received",
    expectedStatus: "Error",
    expectedErrorMessage: "PNC Response not received"
  },
  { eventType: "Other event types", expectedStatus: "Processing", expectedErrorMessage: undefined }
])("returns <$expected/> when eventType is $eventType", ({ eventType, expectedStatus, expectedErrorMessage }) => {
  const auditLogEvent = new AuditLogEvent("information", new Date(), eventType)
  const { status: actualStatus, errorMessage: actualErrorMessage } = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
  expect(actualErrorMessage).toBe(expectedErrorMessage)
})
