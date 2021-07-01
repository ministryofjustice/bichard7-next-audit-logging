import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "src/utils"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  expectedStatus: string
  expectedErrorMessage?: string
}

test.each<TestInput>([
  { eventType: "PNC Response received", expectedStatus: AuditLogStatus.completed, expectedErrorMessage: undefined },
  {
    eventType: "PNC Response not received",
    expectedStatus: AuditLogStatus.error,
    expectedErrorMessage: "PNC Response not received"
  },
  { eventType: "Other event types", expectedStatus: AuditLogStatus.processing, expectedErrorMessage: undefined }
])("returns <$expected/> when eventType is $eventType", ({ eventType, expectedStatus, expectedErrorMessage }) => {
  const auditLogEvent = new AuditLogEvent("information", new Date(), eventType)
  const { status: actualStatus, errorMessage: actualErrorMessage } = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
  expect(actualErrorMessage).toBe(expectedErrorMessage)
})
