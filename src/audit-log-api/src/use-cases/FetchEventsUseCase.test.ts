import "shared-testing"
import type { EventCategory } from "shared-types"
import { AuditLog, AuditLogEvent, AuditLogLookup, isError } from "shared-types"
import { FakeAuditLogDynamoGateway, FakeAuditLogLookupDynamoGateway } from "../test"
import FetchEventsUseCase from "./FetchEventsUseCase"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const auditLogGateway = new FakeAuditLogDynamoGateway()
const auditLogLookupGateway = new FakeAuditLogLookupDynamoGateway()
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const useCase = new FetchEventsUseCase(auditLogGateway, lookupEventValuesUseCase)

const createAuditLogEvent = (category: EventCategory, timestamp: Date, eventType: string): AuditLogEvent =>
  new AuditLogEvent({
    category,
    timestamp,
    eventType,
    eventSource: "Test"
  })

describe("FetchEventsUseCase", () => {
  it("should get the events ordered by timestamp", async () => {
    const expectedEvents = [
      createAuditLogEvent("information", new Date("2021-06-20T10:12:13"), "Event 1"),
      createAuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2"),
      createAuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 3")
    ]
    const message = new AuditLog("External correlation id", new Date(), "Dummy hash")
    message.events = expectedEvents

    auditLogGateway.reset([message])

    const result = await useCase.get(message.messageId)

    expect(isError(result)).toBe(false)

    const actualEvents = <AuditLogEvent[]>result

    expect(actualEvents).toHaveLength(3)
    expect(actualEvents[0].eventType).toBe("Event 1")
    expect(actualEvents[1].eventType).toBe("Event 2")
    expect(actualEvents[2].eventType).toBe("Event 3")
  })

  it("should lookup the events values by default", async () => {
    const message = new AuditLog("External correlation id", new Date(), "Dummy hash")
    const lookupItem = new AuditLogLookup("long value ".repeat(500), message.messageId)
    const eventWithLongAttributeValue = createAuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2")
    eventWithLongAttributeValue.addAttribute("attr1", "short value")
    eventWithLongAttributeValue.addAttribute("attr2", { valueLookup: lookupItem.id })

    const expectedEvents = [
      createAuditLogEvent("information", new Date("2021-06-20T10:12:13"), "Event 1"),
      eventWithLongAttributeValue,
      createAuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 3")
    ]
    message.events = expectedEvents

    auditLogGateway.reset([message])
    auditLogLookupGateway.reset([lookupItem])

    const result = await useCase.get(message.messageId)

    expect(isError(result)).toBe(false)

    const actualEvents = <AuditLogEvent[]>result

    expect(actualEvents).toHaveLength(3)
    expect(actualEvents[0].eventType).toBe("Event 1")
    expect(actualEvents[1].eventType).toBe("Event 2")
    expect(actualEvents[2].eventType).toBe("Event 3")

    const event2Attributes = actualEvents[1].attributes
    expect(event2Attributes).toStrictEqual({
      attr1: "short value",
      attr2: lookupItem.value
    })
  })

  it("should return the lookup id with the events if largeObjects set to false", async () => {
    const message = new AuditLog("External correlation id", new Date(), "Dummy hash")
    const lookupItemId = "exp3ct3d-100kup-1d"
    const eventWithLongAttributeValue = createAuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event")
    eventWithLongAttributeValue.addAttribute("attr1", "short value")
    eventWithLongAttributeValue.addAttribute("attr2", { valueLookup: lookupItemId })

    const expectedEvents = [eventWithLongAttributeValue]
    message.events = expectedEvents

    auditLogGateway.reset([message])

    const fetchLargeObjects = false
    const result = await useCase.get(message.messageId, fetchLargeObjects)

    expect(isError(result)).toBe(false)

    const actualEvents = <AuditLogEvent[]>result

    expect(actualEvents).toHaveLength(1)
    expect(actualEvents[0].eventType).toBe("Event")

    const eventAttributes = actualEvents[0].attributes
    expect(eventAttributes).toStrictEqual({
      attr1: "short value",
      attr2: { valueLookup: lookupItemId }
    })
  })

  it("should return an error when lookup fails", async () => {
    const eventWithLongAttributeValue = createAuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2")
    eventWithLongAttributeValue.addAttribute("attr1", "short value")
    eventWithLongAttributeValue.addAttribute("attr2", { valueLookup: "dummy lookup ID" })
    const message = new AuditLog("External correlation id", new Date(), "Dummy hash")
    message.events = [eventWithLongAttributeValue]
    auditLogGateway.reset([message])

    const expectedError = new Error(`Couldn't lookup for events with message ID '${message.messageId}'`)
    auditLogLookupGateway.shouldReturnError(expectedError)

    const result = await useCase.get(message.messageId)

    expect(result).toBeError(expectedError.message)
  })

  it("should return an error when fetchEvents fails", async () => {
    const expectedError = new Error(`Couldn't fetch events for message '1'`)
    auditLogGateway.shouldReturnError(expectedError)

    const result = await useCase.get("1")

    expect(result).toBeError(expectedError.message)
  })
})
