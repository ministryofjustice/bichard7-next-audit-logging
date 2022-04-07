import "shared-testing"
import { FakeAuditLogLookupDynamoGateway } from "shared-testing"
import { AuditLogEvent, AuditLogLookup } from "shared-types"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const dynamoGateway = new FakeAuditLogLookupDynamoGateway()
const useCase = new LookupEventValuesUseCase(dynamoGateway)

describe("lookupEventValues", () => {
  it("should retrieve values from lookup table", async () => {
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

    dynamoGateway.reset([lookupItem1, lookupItem2])
    const actualEvent = await useCase.execute(event)

    expect(actualEvent).toNotBeError()

    const { category, eventSource, eventType, timestamp, attributes } = actualEvent as AuditLogEvent
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
    const event = new AuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date()
    })
    event.addAttribute("attr1", { valueLookup: "dummy ID" })

    const expectedError = new Error("Dummy error message")
    dynamoGateway.shouldReturnError(expectedError)
    const actualEvent = await useCase.execute(event)

    expect(actualEvent).toBeError(expectedError.message)
  })
})
