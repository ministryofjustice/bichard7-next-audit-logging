import MockDate from "mockdate"
import "shared-testing"
import { FakeAuditLogDynamoGateway } from "shared-testing"
import { AuditLog, AuditLogEvent, BichardAuditLogEvent } from "shared-types"
import SanitiseAuditLogUseCase from "./SanitiseAuditLogUseCase"

const fakeAuditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(fakeAuditLogDynamoGateway)
const createBichardAuditLogEvent = () => {
  const event = new BichardAuditLogEvent({
    eventSourceArn: "dummy event source arn",
    eventSourceQueueName: "dummy event source queue name",
    eventSource: "dummy event source",
    category: "information",
    eventType: "Hearing Outcome marked as resolved by user",
    timestamp: new Date()
  })
  event.addAttribute("Trigger 2 Details", "TRPR0004")
  event.addAttribute("Original Hearing Outcome / PNC Update Dataset", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalPNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("PNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedPNCUpdateDataset", "<?xml><dummy></dummy>")

  return event
}

const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
message.events = [createBichardAuditLogEvent()]
message.automationReport.events = [createBichardAuditLogEvent()]
message.topExceptionsReport.events = [createBichardAuditLogEvent()]
message.nextSanitiseCheck = new Date().toISOString()

afterAll(() => {
  MockDate.reset()
})

it("should remove attributes containing PII", async () => {
  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)

  expect(sanitiseAuditLogResult).toNotBeError()
  const actualMessage = sanitiseAuditLogResult as AuditLog
  const attributes = actualMessage?.events?.[0].attributes ?? {}
  expect(Object.keys(attributes)).toHaveLength(1)
  expect(attributes["Trigger 2 Details"]).toBe("TRPR0004")

  const automationReportAttributes = actualMessage?.automationReport.events[0].attributes ?? {}
  expect(Object.keys(automationReportAttributes)).toHaveLength(1)
  expect(automationReportAttributes["Trigger 2 Details"]).toBe("TRPR0004")

  const topExceptionsReportAttributes = actualMessage?.topExceptionsReport.events[0].attributes ?? {}
  expect(Object.keys(topExceptionsReportAttributes)).toHaveLength(1)
  expect(topExceptionsReportAttributes["Trigger 2 Details"]).toBe("TRPR0004")
})

it("should add a new event when the audit log successfully sanitised", async () => {
  const currentDateTime = new Date("2022-04-12T10:11:12.000Z")
  MockDate.set(currentDateTime)

  const expectedAuditLogEvent = new AuditLogEvent({
    category: "information",
    timestamp: currentDateTime,
    eventType: "Sanitised message",
    eventSource: "Audit Log Api"
  })

  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)

  expect(sanitiseAuditLogResult).toNotBeError()
  const actualMessage = sanitiseAuditLogResult as AuditLog
  expect(actualMessage?.events.slice(-1)[0]).toEqual(expectedAuditLogEvent)
})

it("should delete the nextSanitisedCheck from the audit log when sucessfully sanitised", async () => {
  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)

  expect(sanitiseAuditLogResult).toNotBeError()
  const actualMessage = sanitiseAuditLogResult as AuditLog
  expect(actualMessage.nextSanitiseCheck).toBeFalsy()
})
