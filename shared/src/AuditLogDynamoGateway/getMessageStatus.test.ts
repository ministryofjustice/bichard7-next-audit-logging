import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "../utils"
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
  const auditLogEvent = new AuditLogEvent("information", new Date(), eventType)
  const actualStatus = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
})
