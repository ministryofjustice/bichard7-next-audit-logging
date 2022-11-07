import "src/shared/testing"
import { AuditLogLookup, BichardAuditLogEvent } from "src/shared/types"
import { FakeAuditLogLookupDynamoGateway } from "../test"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const dynamoGateway = new FakeAuditLogLookupDynamoGateway()
const useCase = new LookupEventValuesUseCase(dynamoGateway)

describe("lookupEventValues", () => {
  it("should retrieve values from lookup table", async () => {
    const lookupItemForEventXml = new AuditLogLookup("a".repeat(2000), "dummy message ID")
    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date(),
      eventSourceArn: "event source arn",
      eventSourceQueueName: "event source queue name",
      eventXml: { valueLookup: lookupItemForEventXml.id } as unknown as string
    })
    const lookupItem1 = new AuditLogLookup("a".repeat(2000), "dummy message ID")
    const lookupItem2 = new AuditLogLookup("b".repeat(3000), "dummy message ID")
    event.addAttribute("attr1", { valueLookup: lookupItem1.id })
    event.addAttribute("attr2", "short value")
    event.addAttribute("attr3", 123)
    event.addAttribute("attr4", { valueLookup: lookupItem2.id })

    dynamoGateway.reset([lookupItem1, lookupItem2, lookupItemForEventXml])
    const actualEvent = await useCase.execute(event)

    expect(actualEvent).toNotBeError()

    const { category, eventSource, eventType, timestamp, attributes, eventXml } = actualEvent as BichardAuditLogEvent
    expect(category).toBe(event.category)
    expect(eventSource).toBe(event.eventSource)
    expect(eventType).toBe(event.eventType)
    expect(timestamp).toBe(event.timestamp)
    expect(eventXml).toBe(lookupItemForEventXml.value)
    expect(attributes).toStrictEqual({
      attr1: lookupItem1.value,
      attr2: "short value",
      attr3: 123,
      attr4: lookupItem2.value
    })
  })

  it("should return error if it cannot save into lookup table", async () => {
    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date(),
      eventSourceArn: "event source arn",
      eventSourceQueueName: "event source queue name",
      eventXml: { valueLookup: "dummy ID" } as unknown as string
    })
    event.addAttribute("attr1", { valueLookup: "dummy ID" })

    const expectedError = new Error("Dummy error message")
    dynamoGateway.shouldReturnError(expectedError)
    const actualEvent = await useCase.execute(event)

    expect(actualEvent).toBeError(expectedError.message)
  })
})
