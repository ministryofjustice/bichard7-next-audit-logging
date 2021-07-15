import { isError, AuditLogEvent, EventCategory, AuditLog } from "shared"
import { FakeAuditLogDynamoGateway } from "@bichard/testing"
import FetchEventsUseCase from "./FetchEventsUseCase"

const gateway = new FakeAuditLogDynamoGateway()
const useCase = new FetchEventsUseCase(gateway)

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
    const message = new AuditLog("External correlation id", new Date(), "Xml")
    message.events = expectedEvents

    gateway.reset([message])

    const result = await useCase.get(message.messageId)

    expect(isError(result)).toBe(false)

    const actualEvents = <AuditLogEvent[]>result

    expect(actualEvents).toHaveLength(3)
    expect(actualEvents[0].eventType).toBe("Event 1")
    expect(actualEvents[1].eventType).toBe("Event 2")
    expect(actualEvents[2].eventType).toBe("Event 3")
  })

  it("should return an error when fetchEvents fails", async () => {
    const expectedError = new Error(`Couldn't fetch events for message '1'`)
    gateway.shouldReturnError(expectedError)

    const result = await useCase.get("1")

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })
})
