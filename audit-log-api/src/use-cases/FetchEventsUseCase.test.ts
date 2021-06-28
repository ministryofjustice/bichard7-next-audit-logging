import { isError, DynamoDbConfig, AuditLogDynamoGateway, AuditLogEvent } from "shared"
import FetchEventsUseCase from "./FetchEventsUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const gateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const useCase = new FetchEventsUseCase(gateway)

describe("FetchEventsUseCase", () => {
  it("should get the events ordered by timestamp", async () => {
    const expectedEvents = [
      new AuditLogEvent("information", new Date("2021-06-20T10:12:13"), "Event 1"),
      new AuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2"),
      new AuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 3")
    ]

    jest.spyOn(gateway, "fetchEvents").mockResolvedValue(expectedEvents)

    const result = await useCase.get("Message Id")

    expect(isError(result)).toBe(false)

    const actualEvents = <AuditLogEvent[]>result

    expect(actualEvents).toHaveLength(3)
    expect(actualEvents[0].eventType).toBe("Event 1")
    expect(actualEvents[1].eventType).toBe("Event 2")
    expect(actualEvents[2].eventType).toBe("Event 3")
  })

  it("should return an error when fetchEvents fails", async () => {
    const messageId = "Message Id 1"
    const expectedError = new Error(`Couldn't fetch events for message '${messageId}'`)
    jest.spyOn(gateway, "fetchEvents").mockResolvedValue(expectedError)

    const result = await useCase.get(messageId)

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })
})
