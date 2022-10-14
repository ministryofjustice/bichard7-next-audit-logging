import "shared-testing"
import { AuditLogEvent, BichardAuditLogEvent } from "shared-types"
import { FakeAuditLogLookupDynamoGateway } from "../test"
import StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"

const dynamoGateway = new FakeAuditLogLookupDynamoGateway()
const useCase = new StoreValuesInLookupTableUseCase(dynamoGateway)

describe("StoreValuesInLookupTableUseCase", () => {
  it("should save eventXml and long attribute values in lookup table", async () => {
    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date(),
      eventSourceArn: "event source arn",
      eventSourceQueueName: "event source queue name",
      eventXml: "Event XML should be saved in lookup table"
    })
    event.addAttribute("attr1", "a".repeat(2000))
    event.addAttribute("attr2", "short value")
    event.addAttribute("attr3", 123)
    event.addAttribute("attr4", "b".repeat(3000))

    dynamoGateway.reset()

    const actualEvent = await useCase.execute(event, "dummy message ID")

    expect(actualEvent).toNotBeError()

    const { category, eventSource, eventType, timestamp, attributes, eventXml } = actualEvent as BichardAuditLogEvent
    expect(category).toBe(event.category)
    expect(eventSource).toBe(event.eventSource)
    expect(eventType).toBe(event.eventType)
    expect(timestamp).toBe(event.timestamp)
    expect(dynamoGateway.items).toHaveLength(3)
    expect(attributes).toStrictEqual({
      attr1: { valueLookup: dynamoGateway.items[0].id },
      attr2: "short value",
      attr3: 123,
      attr4: { valueLookup: dynamoGateway.items[1].id }
    })
    expect(eventXml).toStrictEqual({ valueLookup: dynamoGateway.items[2].id })
  })

  it("should return error if it cannot save into lookup table", async () => {
    const event = new AuditLogEvent({
      category: "information",
      eventSource: "event source",
      eventType: "event type",
      timestamp: new Date()
    })
    event.addAttribute("attr1", "a".repeat(2000))

    const expectedError = new Error("Dummy error message")
    dynamoGateway.shouldReturnError(expectedError)

    const actualEvent = await useCase.execute(event, "dummy message ID")

    expect(actualEvent).toBeError(expectedError.message)
  })
})
