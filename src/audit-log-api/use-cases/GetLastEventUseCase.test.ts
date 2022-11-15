import "src/shared/testing"
import { mockDynamoAuditLog } from "src/shared/testing"
import type { EventCategory } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
import type { AuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { FakeAuditLogDynamoGateway } from "../test"

import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const auditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const lookupEventValuesUseCase = new LookupEventValuesUseCase({} as unknown as AuditLogLookupDynamoGateway)
const useCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway, lookupEventValuesUseCase)

const createEvent = (date: string, category: EventCategory): AuditLogEvent => {
  return new AuditLogEvent({
    category,
    timestamp: new Date(date),
    eventType: "Dummy Event Type",
    eventSource: "Dummy Event Source"
  })
}
const createFailureEvent = (date: string, category: EventCategory): AuditLogEvent => {
  const event = createEvent(date, category)

  return {
    ...event,
    eventXml: "Expected Event XML",
    eventSourceQueueName: "Expected Queue Name"
  } as AuditLogEvent
}

it("should return the last event when message exists and has events", async () => {
  const lookupEventValuesUseCaseSpy = jest
    .spyOn(lookupEventValuesUseCase, "execute")
    .mockImplementation((event) => Promise.resolve(event))
  const message = mockDynamoAuditLog({ receivedDate: "2021-07-22T08:10:10Z" })
  message.events.push(createEvent("2021-07-22T09:10:10", "information"))
  message.events.push(createFailureEvent("2021-07-22T12:10:10", "error"))
  message.events.push(createEvent("2021-07-22T10:10:10", "information"))

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toNotBeError()

  const event = result as AuditLogEvent
  expect(event.eventXml).toBe("Expected Event XML")
  expect(event.eventSourceQueueName).toBe("Expected Queue Name")
  expect(lookupEventValuesUseCaseSpy).toHaveBeenCalledTimes(1)
})

it("should return error when there are no events against the message", async () => {
  const message = mockDynamoAuditLog({ receivedDate: "2021-07-22T08:10:10Z" })

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toBeError(`No events found for message '${message.messageId}'`)
})

it("should return error when message does not exist", async () => {
  auditLogDynamoGateway.reset([])
  const result = await useCase.get("Dummy Message Id")

  expect(result).toBeError("No events found for message 'Dummy Message Id'")
})
