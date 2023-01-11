import MockDate from "mockdate"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { mockApiAuditLogEvent } from "src/shared/testing"
import CreateAuditLogUserEventsUseCase from "./CreateAuditLogUserEventsUseCase"
import { TestDynamoGateway, auditLogDynamoConfig } from "../test"
import { DynamoAuditLogEvent } from "src/shared/types"

type EventRecordType = DynamoAuditLogEvent & { _id: string }
const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const useCase = new CreateAuditLogUserEventsUseCase(gateway)

describe("create", () => {
  beforeEach(async () => {
    MockDate.reset()
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
    jest.clearAllMocks()
  })

  it("should insert one event into dynamodb events table", async () => {
    MockDate.set(new Date("2023-01-11T14:44:23.654Z"))
    const event = mockApiAuditLogEvent()

    const result = await useCase.create("User 1", event)

    expect(result).toNotBeError()

    const actualEventsResult = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
    const actualEvents = actualEventsResult.Items

    expect(actualEvents).toBeDefined()
    expect(actualEvents).toHaveLength(1)

    const { _id: actualEvent1Id, ...actualEvent1 } = actualEvents![0]
    expect(actualEvent1Id).toBeDefined()
    expect(actualEvent1).toStrictEqual({
      _automationReport: 0,
      _topExceptionsReport: 0,
      eventSource: "Test",
      eventType: "Test event",
      eventXml: {
        _compressedValue: "eJztxzENACAMADArEzUL+4CHhSAfA0hov2btjjq1Ou4caWZmZmZmZmZmZmZmZmafPZI4ZrM="
      },
      eventCode: "dummy.event.code",
      eventSourceQueueName: "Test event source queue name",
      attributes: {
        "Attribute 1": {
          _compressedValue: "eJztxzENACAMADArs4AEpIzAwUuGf4TQfu1VZ49bK1rMrOzu7u7u7u7u7u7u7u7u7u4f/gG7Ejmy"
        },
        "Attribute 2": "Attribute 2 data"
      },
      category: "information",
      user: "User 1",
      timestamp: "2023-01-11T14:44:23.654Z",
      _: "_"
    })
  })

  it("should insert multiple events into dynamodb events table", async () => {
    MockDate.set(new Date("2023-01-11T14:44:23.654Z"))
    const events = [
      mockApiAuditLogEvent({ eventCode: "code 1" }),
      mockApiAuditLogEvent({ eventCode: "code 2" }),
      mockApiAuditLogEvent({ eventCode: "code 3" })
    ]

    const result = await useCase.create("User 5", events)

    expect(result).toNotBeError()

    const actualEventsResult = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
    const actualEvents = (actualEventsResult.Items as EventRecordType[]).sort((e1, e2) =>
      e1.eventCode < e2.eventCode ? -1 : 1
    )

    expect(actualEvents).toBeDefined()
    expect(actualEvents).toHaveLength(3)

    const expectedEvent = {
      _automationReport: 0,
      _topExceptionsReport: 0,
      eventSource: "Test",
      eventType: "Test event",
      eventXml: {
        _compressedValue: "eJztxzENACAMADArEzUL+4CHhSAfA0hov2btjjq1Ou4caWZmZmZmZmZmZmZmZmafPZI4ZrM="
      },
      eventSourceQueueName: "Test event source queue name",
      attributes: {
        "Attribute 1": {
          _compressedValue: "eJztxzENACAMADArs4AEpIzAwUuGf4TQfu1VZ49bK1rMrOzu7u7u7u7u7u7u7u7u7u4f/gG7Ejmy"
        },
        "Attribute 2": "Attribute 2 data"
      },
      category: "information",
      user: "User 5",
      timestamp: "2023-01-11T14:44:23.654Z",
      _: "_"
    }

    const { _id: actualEvent1Id, ...actualEvent1 } = actualEvents![0]
    expect(actualEvent1Id).toBeDefined()
    expect(actualEvent1).toStrictEqual({ ...expectedEvent, eventCode: "code 1" })

    const { _id: actualEvent2Id, ...actualEvent2 } = actualEvents![1]
    expect(actualEvent2Id).toBeDefined()
    expect(actualEvent2).toStrictEqual({ ...expectedEvent, eventCode: "code 2" })

    const { _id: actualEvent3Id, ...actualEvent3 } = actualEvents![2]
    expect(actualEvent3Id).toBeDefined()
    expect(actualEvent3).toStrictEqual({ ...expectedEvent, eventCode: "code 3" })
  })

  it("should not insert any record when an empty array is passed into the function", async () => {
    const result = useCase.create("Dummy User", [])

    expect(result).toNotBeError()

    const actualEventsResult = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
    expect(actualEventsResult.Items).toHaveLength(0)
  })

  it("should return error if dynamodb gateway fails while inserting records", async () => {
    jest.spyOn(gateway, "createManyUserEvents").mockResolvedValue(new Error("Failed to insert"))

    const event = mockApiAuditLogEvent()
    const result = await useCase.create("User 1", event)

    expect(result.resultDescription).toBe("Failed to insert")
    expect(result.resultType).toBe("error")
  })
})
