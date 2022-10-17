import "shared-testing"
import type { BichardAuditLogEvent, EventCategory } from "shared-types"
import { AuditLog, AuditLogEvent } from "shared-types"
import FakeAuditLogDynamoGateway from "src/test/FakeAuditLogDynamoGateway"
import type { AuditLogLookupDynamoGateway } from "../gateways/dynamo"

import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const auditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const lookupEventValuesUseCase = new LookupEventValuesUseCase({} as unknown as AuditLogLookupDynamoGateway)
const useCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway, lookupEventValuesUseCase)

const createAuditLog = (): AuditLog =>
  new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Dummy hash")
const createEvent = (date: string, category: EventCategory): AuditLogEvent => {
  return new AuditLogEvent({
    category,
    timestamp: new Date(date),
    eventType: "Dummy Event Type",
    eventSource: "Dummy Event Source"
  })
}
const createBichardEvent = (date: string, category: EventCategory): BichardAuditLogEvent => {
  const event = createEvent(date, category)

  return {
    ...event,
    eventXml: "Expected Event XML",
    eventSourceArn: "Expected Event Source ARN",
    eventSourceQueueName: "Expected Queue Name"
  } as BichardAuditLogEvent
}

it("should return the last event when message exists and has events", async () => {
  const lookupEventValuesUseCaseSpy = jest
    .spyOn(lookupEventValuesUseCase, "execute")
    .mockImplementation((event) => Promise.resolve(event))
  const message = createAuditLog()
  message.events.push(createEvent("2021-07-22T09:10:10", "information"))
  message.events.push(createBichardEvent("2021-07-22T12:10:10", "error"))
  message.events.push(createEvent("2021-07-22T10:10:10", "information"))

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toNotBeError()

  const event = result as BichardAuditLogEvent
  expect(event.eventXml).toBe("Expected Event XML")
  expect(event.eventSourceArn).toBe("Expected Event Source ARN")
  expect(event.eventSourceQueueName).toBe("Expected Queue Name")
  expect(lookupEventValuesUseCaseSpy).toHaveBeenCalledTimes(1)
})

it("should return error when there are no events against the message", async () => {
  const message = createAuditLog()

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toBeError(`No events found for message '${message.messageId}'`)
})

it("should return error when message does not exist", async () => {
  auditLogDynamoGateway.reset([])
  const result = await useCase.get("Dummy Message Id")

  expect(result).toBeError("No events found for message 'Dummy Message Id'")
})
