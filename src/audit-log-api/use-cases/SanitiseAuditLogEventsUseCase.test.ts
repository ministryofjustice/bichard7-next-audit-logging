import MockDate from "mockdate"
import "src/shared/testing"
import { mockDynamoAuditLog, mockDynamoAuditLogEvent } from "src/shared/testing"
import type { ApiAuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { EventCode } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import SanitiseAuditLogUseCase from "./SanitiseAuditLogEventsUseCase"

const fakeAuditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(fakeAuditLogDynamoGateway)

const message = mockDynamoAuditLog({
  events: [
    mockDynamoAuditLogEvent({
      attributes: {
        "Trigger 2 Details": "TRPR0004",
        "Original Hearing Outcome / PNC Update Dataset": "<?xml><dummy></dummy>",
        OriginalHearingOutcome: "<?xml><dummy></dummy>",
        OriginalPNCUpdateDataset: "<?xml><dummy></dummy>",
        PNCUpdateDataset: "<?xml><dummy></dummy>",
        AmendedHearingOutcome: "<?xml><dummy></dummy>",
        AmendedPNCUpdateDataset: "<?xml><dummy></dummy>"
      }
    })
  ]
})

afterAll(() => {
  MockDate.reset()
})

it("should remove attributes containing PII", async () => {
  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)

  expect(sanitiseAuditLogResult).toNotBeError()
  const actualMessage = {} as DynamoAuditLog
  const attributes = actualMessage?.events?.[0].attributes ?? {}
  expect(Object.keys(attributes)).toHaveLength(1)
  expect(attributes["Trigger 2 Details"]).toBe("TRPR0004")
})

it("should add a new event when the audit log successfully sanitised", async () => {
  const currentDateTime = new Date("2022-04-12T10:11:12.000Z")
  MockDate.set(currentDateTime)

  const expectedAuditLogEvent: ApiAuditLogEvent = {
    category: "information",
    eventCode: EventCode.Sanitised,
    eventSource: "Audit Log Api",
    eventType: "Sanitised message",
    timestamp: currentDateTime.toISOString()
  }

  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)

  expect(sanitiseAuditLogResult).toNotBeError()
  const actualMessage = {} as DynamoAuditLog
  expect(actualMessage?.events.slice(-1)[0]).toEqual(expectedAuditLogEvent)
})
