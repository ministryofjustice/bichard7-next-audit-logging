import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "../utils"
import getMessageStatus from "./getMessageStatus"

interface TestInput {
  eventType: string
  expectedStatus: string
  expectedEventType?: string
}

test.each<TestInput>([
  {
    eventType: "PNC Response received",
    expectedStatus: AuditLogStatus.completed,
    expectedEventType: "PNC Response received"
  },
  {
    eventType: "PNC Response not received",
    expectedStatus: AuditLogStatus.error,
    expectedEventType: "PNC Response not received"
  },
  { eventType: "Other event types", expectedStatus: AuditLogStatus.processing, expectedEventType: "Other event types" }
])("returns <$expected/> when eventType is $eventType", ({ eventType, expectedStatus, expectedEventType }) => {
  const auditLogEvent = new AuditLogEvent("information", new Date(), eventType)
  const { status: actualStatus, lastEventType: actualEventType } = getMessageStatus(auditLogEvent)
  expect(actualStatus).toBe(expectedStatus)
  expect(actualEventType).toBe(expectedEventType)
})
