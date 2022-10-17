import "shared-testing"
import { AuditLog, AuditLogEvent, AuditLogLookup } from "shared-types"
import { FakeAuditLogLookupDynamoGateway } from "../test"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"
import LookupMessageValuesUseCase from "./LookupMessageValuesUseCase"

const dynamoGateway = new FakeAuditLogLookupDynamoGateway()
const lookupEventValuesUseCase = new LookupEventValuesUseCase(dynamoGateway)
const useCase = new LookupMessageValuesUseCase(lookupEventValuesUseCase)

describe("lookupEventValues", () => {
  it("should retrieve values from lookup table", async () => {
    const message = new AuditLog("dummy external correlation ID", new Date(), "dummy hash")
    const event = new AuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date()
    })
    const lookupItem1 = new AuditLogLookup("a".repeat(2000), "dummy message ID")
    const lookupItem2 = new AuditLogLookup("b".repeat(3000), "dummy message ID")
    event.addAttribute("attr1", { valueLookup: lookupItem1.id })
    event.addAttribute("attr2", "short value")
    event.addAttribute("attr3", 123)
    event.addAttribute("attr4", { valueLookup: lookupItem2.id })

    message.events.push(event)

    dynamoGateway.reset([lookupItem1, lookupItem2])
    const result = await useCase.execute(message)

    expect(result).toNotBeError()

    const actualMessage = result as AuditLog
    const { category, eventSource, eventType, timestamp, attributes } = actualMessage.events[0]
    expect(category).toBe(event.category)
    expect(eventSource).toBe(event.eventSource)
    expect(eventType).toBe(event.eventType)
    expect(timestamp).toBe(event.timestamp)
    expect(attributes).toStrictEqual({
      attr1: lookupItem1.value,
      attr2: "short value",
      attr3: 123,
      attr4: lookupItem2.value
    })
  })

  it("should return error if it cannot save into lookup table", async () => {
    const message = new AuditLog("dummy external correlation ID", new Date(), "dummy hash")
    const event = new AuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date()
    })
    event.addAttribute("attr1", { valueLookup: "dummy ID" })
    message.events.push(event)

    const expectedError = new Error("Dummy error message")
    dynamoGateway.shouldReturnError(expectedError)
    const actualEvent = await useCase.execute(message)

    expect(actualEvent).toBeError(expectedError.message)
  })
})
