import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import { randomInt, randomUUID } from "crypto"
import { addDays } from "date-fns"
import MockDate from "mockdate"
import { auditLogDynamoConfig } from "src/audit-log-api/test"
import { compress, decompress } from "src/shared"
import "src/shared/testing"
import {
  createMockAuditLog,
  mockApiAuditLogEvent,
  mockDynamoAuditLog,
  mockDynamoAuditLogEvent,
  mockDynamoAuditLogUserEvent
} from "src/shared/testing"
import type { ApiAuditLogEvent, DynamoAuditLog, DynamoAuditLogEvent, KeyValuePair } from "src/shared/types"
import { AuditLogStatus, isError } from "src/shared/types"
import TestDynamoGateway from "../../../test/TestDynamoGateway"
import { IndexSearcher } from "../DynamoGateway"
import AuditLogDynamoGateway, { getEventsPageLimit } from "./AuditLogDynamoGateway"

const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const primaryKey = "messageId"

const createMockDynamoAuditLog = async () => {
  const apiAuditLog = (await createMockAuditLog()) as DynamoAuditLog
  return (await gateway.fetchOne(apiAuditLog.messageId, {
    includeColumns: ["version", "eventsCode"]
  })) as DynamoAuditLog
}

describe("AuditLogDynamoGateway", () => {
  beforeEach(async () => {
    MockDate.reset()
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, primaryKey)
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = mockDynamoAuditLog()

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <DynamoAuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessage.expiryTime).toBeUndefined()
    })

    it("should return an error when the given message already exists", async () => {
      const message = mockDynamoAuditLog()
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })

    it("should set an expiry time of ~1 week in the E2E environment", async () => {
      const expectedMessage = mockDynamoAuditLog()

      process.env.IS_E2E = "true"
      const result = await gateway.create(expectedMessage)
      delete process.env.IS_E2E

      expect(isError(result)).toBe(false)

      const actualMessage = <DynamoAuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)

      expect(actualMessage.expiryTime).toBeDefined()

      const secondsToExpiry = Math.floor(parseInt(actualMessage.expiryTime || "0") - new Date().getTime() / 1000)
      const oneDayInSecs = 24 * 60 * 60
      expect(secondsToExpiry).toBeLessThanOrEqual(8 * oneDayInSecs)
      expect(secondsToExpiry).toBeGreaterThanOrEqual(6 * oneDayInSecs)
    })
  })

  describe("createMany()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = mockDynamoAuditLog()

      const result = await gateway.createMany([expectedMessage])

      expect(isError(result)).toBe(false)

      const actualMessages = <DynamoAuditLog[]>result
      expect(actualMessages).toHaveLength(1)
      expect(actualMessages[0].messageId).toBe(expectedMessage.messageId)
      expect(actualMessages[0].receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessages[0].expiryTime).toBeUndefined()
    })

    it("should return an error when the given message already exists", async () => {
      const messages = new Array(10).fill(0).map(() => mockDynamoAuditLog())
      await gateway.create(messages[4])

      const result = await gateway.createMany(messages)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toContain("ConditionalCheckFailed")
    })

    it("should set an expiry time of ~1 week in the E2E environment", async () => {
      const expectedMessage = mockDynamoAuditLog()

      process.env.IS_E2E = "true"
      const result = await gateway.createMany([expectedMessage])
      delete process.env.IS_E2E

      expect(isError(result)).toBe(false)

      const actualMessages = <DynamoAuditLog[]>result
      expect(actualMessages).toHaveLength(1)
      expect(actualMessages[0].messageId).toBe(expectedMessage.messageId)

      expect(actualMessages[0].expiryTime).toBeDefined()

      const secondsToExpiry = Math.floor(parseInt(actualMessages[0].expiryTime || "0") - new Date().getTime() / 1000)
      const oneDayInSecs = 24 * 60 * 60
      expect(secondsToExpiry).toBeLessThanOrEqual(8 * oneDayInSecs)
      expect(secondsToExpiry).toBeGreaterThanOrEqual(6 * oneDayInSecs)
    })
  })

  describe("createManyUserEvents", () => {
    it("should insert multiple user events", async () => {
      MockDate.set(new Date("2023-01-11T12:51:49.678Z"))

      const userEvents = [
        mockDynamoAuditLogUserEvent({ user: "User 1" }),
        mockDynamoAuditLogUserEvent({ user: "User 2" })
      ]

      const result = await gateway.createManyUserEvents(userEvents)

      expect(result).toNotBeError()

      const actualEventsResult = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
      const actualEvents = actualEventsResult.Items

      expect(actualEvents).toBeDefined()
      expect(actualEvents).toHaveLength(2)

      const { _id: actualEvent1Id, ...actualEvent1 } = actualEvents!.find((x) => x.user == "User 1")!
      expect(actualEvent1Id).toBeDefined()
      expect(actualEvent1).toMatchSnapshot()

      const { _id: actualEvent2Id, ...actualEvent2 } = actualEvents!.find((x) => x.user == "User 2")!
      expect(actualEvent2Id).toBeDefined()
      expect(actualEvent2).toMatchSnapshot()
    })
  })

  describe("getEvents", () => {
    const generateAuditLogEvents = (numberOfEvents: number) =>
      [...Array(numberOfEvents).keys()].map(() =>
        mockDynamoAuditLogEvent({
          _messageId: "dummy-id",
          timestamp: new Date(Date.now() - randomInt(1000000)).toISOString()
        })
      )

    it("should return all events sorted for the specified message ID", async () => {
      let expectedEvents: DynamoAuditLogEvent[] = []

      await Promise.all(
        [...Array(5).keys()].map(() => {
          const events = generateAuditLogEvents(50)
          expectedEvents = expectedEvents.concat(events)
          return gateway.createManyUserEvents(events)
        })
      )

      expectedEvents = expectedEvents.sort((a, b) =>
        a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0
      )

      const result = await gateway.getEvents("dummy-id")

      expect(isError(result)).toBe(false)

      const items = result as DynamoAuditLogEvent[]
      expect(items).toHaveLength(250)
      expect(items.map((item) => item.timestamp)).toStrictEqual(expectedEvents.map((event) => event.timestamp))
    })

    it(`should return all events when a message has ${getEventsPageLimit} events as the page limit in the query`, async () => {
      let expectedEvents: DynamoAuditLogEvent[] = []

      const events = generateAuditLogEvents(getEventsPageLimit)
      expectedEvents = expectedEvents.concat(events)
      await gateway.createManyUserEvents(events)

      expectedEvents = expectedEvents.sort((a, b) =>
        a.timestamp > b.timestamp ? 1 : b.timestamp > a.timestamp ? -1 : 0
      )

      const result = await gateway.getEvents("dummy-id")

      expect(isError(result)).toBe(false)

      const items = result as DynamoAuditLogEvent[]
      expect(items).toHaveLength(getEventsPageLimit)
      expect(items.map((item) => item.timestamp)).toStrictEqual(expectedEvents.map((event) => event.timestamp))
    })

    it("should return error when it fails to get result from DynamoDB", async () => {
      await gateway.createManyUserEvents(generateAuditLogEvents(1))

      const expectedError = new Error("get events dummy error")
      jest.spyOn(IndexSearcher.prototype, "execute").mockResolvedValueOnce(expectedError)
      const result = await gateway.getEvents("dummy-id")

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })
  })

  describe("fetchOne", () => {
    it("should return the matching AuditLog and no AuditLogEvent when message does not have any event", async () => {
      const expectedAuditLog = mockDynamoAuditLog()
      await gateway.create(expectedAuditLog)

      const expectedAuditLogEvents = [
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId }),
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId })
      ]
      await gateway.createManyUserEvents(expectedAuditLogEvents)

      const result = await gateway.fetchOne(expectedAuditLog.messageId)

      expect(isError(result)).toBe(false)

      const actualAuditLog = <DynamoAuditLog>result
      expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
      expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
      expect(actualAuditLog.receivedDate).toBe(expectedAuditLog.receivedDate)
      expect(actualAuditLog.events).toHaveLength(2)
    })

    it("should not return events when events column is excluded", async () => {
      const expectedAuditLog = mockDynamoAuditLog()
      await gateway.create(expectedAuditLog)

      const expectedAuditLogEvents = [
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId }),
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId })
      ]
      await gateway.createManyUserEvents(expectedAuditLogEvents)

      const result = await gateway.fetchOne(expectedAuditLog.messageId, { excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)

      const actualAuditLog = <DynamoAuditLog>result
      expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
      expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
      expect(actualAuditLog.receivedDate).toBe(expectedAuditLog.receivedDate)
      expect(actualAuditLog.events).toBeUndefined()
    })

    it("should return error when it fails to get events", async () => {
      const expectedError = Error("Dummy error")
      const expectedAuditLog = mockDynamoAuditLog()
      await gateway.create(expectedAuditLog)

      const expectedAuditLogEvents = [
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId }),
        mockDynamoAuditLogEvent({ _messageId: expectedAuditLog.messageId })
      ]
      await gateway.createManyUserEvents(expectedAuditLogEvents)
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)

      const result = await gateway.fetchOne(expectedAuditLog.messageId)

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should return null when no AuditLog matches the given messageId", async () => {
      const result = await gateway.fetchOne("InvalidMessageId")

      expect(isError(result)).toBe(false)
      expect(result as DynamoAuditLog).toBeUndefined()
    })
  })

  describe("fetchVersion", () => {
    it("should return the version of the matching AuditLog", async () => {
      const expectedAuditLog = mockDynamoAuditLog()
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchVersion(expectedAuditLog.messageId)

      expect(isError(result)).toBe(false)

      expect(<number>result).toBe(expectedAuditLog.version)
    })

    it("should return null when no AuditLog matches the given messageId", async () => {
      const result = await gateway.fetchVersion("InvalidMessageId")

      expect(isError(result)).toBe(false)
      expect(result).toBeNull()
    })
  })

  describe("fetchMany", () => {
    it("should return limited amount of AuditLogs", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchMany({ limit: 1 })

      expect(isError(result)).toBe(false)

      const items = result as DynamoAuditLog[]
      expect(items).toHaveLength(1)
      expect(items[0].events).toHaveLength(1)
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchMany({ limit: 1, excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)

      const items = result as DynamoAuditLog[]
      expect(items).toHaveLength(1)
      expect(items[0].events).toBeUndefined()
    })

    it("should return error when it fails to get events", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedError = new Error("fetch many dummy error")
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)
      const result = await gateway.fetchMany({ limit: 1 })

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should return AuditLogs ordered by receivedDate", async () => {
      const receivedDates = ["2021-06-01T10:11:12.000Z", "2021-06-05T10:11:12.000Z", "2021-06-03T10:11:12.000Z"]
      const expectedReceivedDates = receivedDates
        .map((dateString: string) => new Date(dateString).toISOString())
        .sort()
        .reverse()

      await Promise.allSettled(
        receivedDates.map(async (receivedDate: string) => {
          await gateway.create(mockDynamoAuditLog({ receivedDate }))
        })
      )

      const result = await gateway.fetchMany({ limit: 3 })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(3)

      const actualAuditLogs = <DynamoAuditLog[]>result

      expect(actualAuditLogs).toBeDefined()
      expect(actualAuditLogs[0].receivedDate).toBe(expectedReceivedDates[0])
      expect(actualAuditLogs[1].receivedDate).toBe(expectedReceivedDates[1])
      expect(actualAuditLogs[2].receivedDate).toBe(expectedReceivedDates[2])
    })
  })

  describe("fetchRange", () => {
    it("should return limited amount of AuditLogs", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(
        auditLogs.map(async (auditLog) => {
          await gateway.create(auditLog)
        })
      )

      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchRange({ limit: 1, start: new Date("2020-01-01"), end: new Date("2100-01-01") })

      expect(isError(result)).toBe(false)

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(1)
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(
        auditLogs.map(async (auditLog) => {
          await gateway.create(auditLog)
        })
      )

      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchRange({
        limit: 1,
        start: new Date("2020-01-01"),
        end: new Date("2100-01-01"),
        excludeColumns: ["events"]
      })

      expect(isError(result)).toBe(false)

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toBeUndefined()
    })

    it("should return error when it fails to get events", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(
        auditLogs.map(async (auditLog) => {
          await gateway.create(auditLog)
        })
      )

      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedError = new Error("fetch range dummy error")
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)

      const result = await gateway.fetchRange({
        limit: 1,
        start: new Date("2020-01-01"),
        end: new Date("2100-01-01")
      })

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should return AuditLogs ordered by receivedDate", async () => {
      const receivedDates = ["2021-06-01T10:11:12.000Z", "2021-06-05T10:11:12.000Z", "2021-06-03T10:11:12.000Z"]
      const expectedReceivedDates = receivedDates
        .map((dateString: string) => new Date(dateString).toISOString())
        .sort()
        .reverse()

      await Promise.allSettled(
        receivedDates.map(async (receivedDate: string) => {
          await gateway.create(mockDynamoAuditLog({ receivedDate }))
        })
      )

      const result = await gateway.fetchRange({ start: new Date("2020-01-01"), end: new Date("2100-01-01") })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(3)

      const actualAuditLogs = <DynamoAuditLog[]>result

      expect(actualAuditLogs).toBeDefined()
      expect(actualAuditLogs[0].receivedDate).toBe(expectedReceivedDates[0])
      expect(actualAuditLogs[1].receivedDate).toBe(expectedReceivedDates[1])
      expect(actualAuditLogs[2].receivedDate).toBe(expectedReceivedDates[2])
    })

    it("should filter based on start and end date", async () => {
      const receivedDates = ["2021-06-01T10:11:12.000Z", "2021-06-05T10:11:12.000Z", "2021-06-03T10:11:12.000Z"]
      const expectedReceivedDates = receivedDates
        .map((dateString: string) => new Date(dateString).toISOString())
        .sort()
        .reverse()

      await Promise.allSettled(
        receivedDates.map(async (receivedDate: string) => {
          await gateway.create(mockDynamoAuditLog({ receivedDate }))
        })
      )

      const result = await gateway.fetchRange({ start: new Date("2021-06-02"), end: new Date("2021-06-04") })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(1)

      const actualAuditLogs = <DynamoAuditLog[]>result

      expect(actualAuditLogs).toBeDefined()
      expect(actualAuditLogs[0].receivedDate).toBe(expectedReceivedDates[1])
    })

    it("should allow events to be filtered for the automation report", async () => {
      const auditLog = await createMockDynamoAuditLog()

      await gateway.update(auditLog, {
        events: [
          mockDynamoAuditLogEvent({ eventType: "Type 1", _automationReport: 0 }),
          mockDynamoAuditLogEvent({ eventType: "Type 2", _automationReport: 1 })
        ]
      })

      const result = await gateway.fetchRange({
        limit: 1,
        start: new Date("2020-01-01"),
        end: new Date("2100-01-01"),
        eventsFilter: "automationReport"
      })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(1)
      expect(actualAuditLogs[0].events[0].eventType).toBe("Type 2")
    })
  })

  describe("fetchByExternalCorrelationId", () => {
    it("should return one AuditLog when external correlation id exists in the table", async () => {
      const auditLogs = [...Array(3).keys()].map((i: number) =>
        mockDynamoAuditLog({ externalCorrelationId: `External correlation id ${i}` })
      )
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const correlationId = "External correlation id 2"
      const result = await gateway.fetchByExternalCorrelationId(correlationId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <DynamoAuditLog>result
      expect(item.externalCorrelationId).toBe(correlationId)
      expect(item.events).toHaveLength(1)
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map((i: number) =>
        mockDynamoAuditLog({ externalCorrelationId: `External correlation id ${i}` })
      )
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const correlationId = "External correlation id 2"
      const result = await gateway.fetchByExternalCorrelationId(correlationId, { excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <DynamoAuditLog>result
      expect(item.externalCorrelationId).toBe(correlationId)
      expect(item.events).toBeUndefined()
    })

    it("should return error it fails to get events", async () => {
      const expectedError = new Error("fetch by external correlation id dummy error")
      const auditLogs = [...Array(3).keys()].map((i: number) =>
        mockDynamoAuditLog({ externalCorrelationId: `External correlation id ${i}` })
      )
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)
      const correlationId = "External correlation id 2"
      const result = await gateway.fetchByExternalCorrelationId(correlationId)

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should throw error when external correlation id does not exist in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )

      const externalCorrelationId = "External correlation id does not exist"
      const result = await gateway.fetchByExternalCorrelationId(externalCorrelationId)

      expect(isError(result)).toBe(false)
      expect(<DynamoAuditLog>result).toBeNull()
    })
  })

  describe("fetchByHash", () => {
    it("should return all AuditLog records with the same hash", async () => {
      const messageHash = "same-hash"
      const auditLogs = Array.from([...Array(3).keys()].map(() => mockDynamoAuditLog({ messageHash })))
      auditLogs.push(mockDynamoAuditLog({ messageHash: "different-hash" }))
      await Promise.all(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchByHash(messageHash)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = result as unknown as DynamoAuditLog[]
      expect(items).toHaveLength(3)

      items.forEach((item) => {
        expect(item.messageHash).toBe(messageHash)
        expect(item.events).toHaveLength(1)
      })
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map((i: number) => mockDynamoAuditLog({ messageHash: `hash-${i}` }))
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const hash = "hash-2"
      const result = await gateway.fetchByHash(hash, { excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = result as unknown as DynamoAuditLog[]
      expect(items).toHaveLength(1)

      const [item] = items
      expect(item.messageHash).toBe(hash)
      expect(item.events).toBeUndefined()
    })

    it("should return error when it fails to get events", async () => {
      const auditLogs = [...Array(3).keys()].map((i: number) => mockDynamoAuditLog({ messageHash: `hash-${i}` }))
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedError = new Error("fetch by hash dummy error")
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)
      const hash = "hash-2"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should return empty array when hash does not exist in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )

      const hash = "Hash does not exist"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(0)
    })
  })

  describe("fetchByStatus", () => {
    it("should return one AuditLog when there is a record with Completed status", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      await gateway.createManyUserEvents(
        [...auditLogs, expectedAuditLog].map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.status).toBe(expectedAuditLog.status)
      expect(item.events).toHaveLength(1)
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      await gateway.createManyUserEvents(
        [...auditLogs, expectedAuditLog].map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchByStatus(AuditLogStatus.completed, { excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.status).toBe(expectedAuditLog.status)
      expect(item.events).toBeUndefined()
    })

    it("should return error when it fails to get events", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog())
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      await gateway.createManyUserEvents(
        [...auditLogs, expectedAuditLog].map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedError = new Error("fetch by status dummy error")
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)
      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })
  })

  describe("fetchUnsanitised", () => {
    it("should return one AuditLog when there is an unsanitised record to check", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog({ isSanitised: 1 }))
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)
      await gateway.createManyUserEvents(
        [...auditLogs, expectedAuditLog].map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.isSanitised).toBeFalsy()
      expect(item.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(item.events).toHaveLength(1)
    })

    it("should return error when it fails to get events", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog({ isSanitised: 1 }))
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      const expectedError = new Error("fetch unsanitised dummy error")
      jest.spyOn(gateway, "getEvents").mockResolvedValueOnce(expectedError)
      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(true)
      expect(result).toBeError(expectedError.message)
    })

    it("should not return events when events column is excluded", async () => {
      const auditLogs = [...Array(3).keys()].map(() => mockDynamoAuditLog({ isSanitised: 1 }))
      await Promise.allSettled(auditLogs.map((auditLog) => gateway.create(auditLog)))
      await gateway.createManyUserEvents(
        auditLogs.map((auditLog) => mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }))
      )

      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchUnsanitised({ excludeColumns: ["events"] })

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)
      expect(items[0].events).toBeUndefined()
    })

    it("shouldn't return any AuditLogs with unsanitised records not due to be checked", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          const auditLog = mockDynamoAuditLog({ isSanitised: 1 })
          await gateway.create(auditLog)
        })
      )

      const expectedAuditLog = mockDynamoAuditLog({ nextSanitiseCheck: addDays(new Date(), 1).toISOString() })
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(0)
    })
  })

  describe("update()", () => {
    let auditLog: DynamoAuditLog

    beforeEach(async () => {
      auditLog = mockDynamoAuditLog()
      await gateway.create(auditLog)
    })

    it("should not update if an empty object is passed in", async () => {
      const before = await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )

      const result = await gateway.update(auditLog, {})
      expect(result).toNotBeError()

      const after = await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )

      expect(after).toStrictEqual(before)
    })

    it.each([
      ["forceOwner", { forceOwner: 10 }],
      ["status", { status: AuditLogStatus.completed }],
      ["pncStatus", { pncStatus: "Processing" }],
      ["triggerStatus", { triggerStatus: "NoTriggers" }],
      ["errorRecordArchivalDate", { errorRecordArchivalDate: "2020-01-01" }],
      ["isSanitised", { isSanitised: 1 }],
      ["retryCount", { retryCount: 10 }]
    ] as [string, Partial<DynamoAuditLog>][])(
      "should update the %s if it is passed in",
      async (key: string, updates: Partial<DynamoAuditLog>) => {
        const result = await gateway.update(auditLog, updates)
        expect(result).toNotBeError()

        const updated = (
          (await gateway.getOne(
            auditLogDynamoConfig.auditLogTableName,
            gateway.auditLogTableKey,
            auditLog.messageId
          )) as DocumentClient.GetItemOutput
        ).Item!

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expected = updates as KeyValuePair<string, any>
        expect(updated[key]).toBe(expected[key])
      }
    )

    it("should update multiple values if multiple values are passed in", async () => {
      const result = await gateway.update(auditLog, {
        errorRecordArchivalDate: "2020-01-02",
        forceOwner: 22,
        isSanitised: 1,
        pncStatus: "Processing",
        retryCount: 55,
        status: AuditLogStatus.completed,
        triggerStatus: "NoTriggers"
      })

      expect(result).toNotBeError()

      const updated = (
        (await gateway.getOne(
          auditLogDynamoConfig.auditLogTableName,
          gateway.auditLogTableKey,
          auditLog.messageId
        )) as DocumentClient.GetItemOutput
      ).Item!

      expect(updated.errorRecordArchivalDate).toBe("2020-01-02")
      expect(updated.forceOwner).toBe(22)
      expect(updated.isSanitised).toBe(1)
      expect(updated.pncStatus).toBe("Processing")
      expect(updated.retryCount).toBe(55)
      expect(updated.status).toBe("Completed")
      expect(updated.triggerStatus).toBe("NoTriggers")
    })

    it("should add events to the events table if they are passed in", async () => {
      const events = [mockDynamoAuditLogEvent()]
      const result = await gateway.update(auditLog, { events })
      expect(result).toNotBeError()

      const updated = (
        (await gateway.getOne(
          auditLogDynamoConfig.auditLogTableName,
          gateway.auditLogTableKey,
          auditLog.messageId
        )) as DocumentClient.GetItemOutput
      ).Item!

      expect(updated.events).toBeUndefined()
      expect(updated.eventsCount).toBe(1)

      const allEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items
      expect(allEvents).toHaveLength(1)
    })

    it("should increase eventsCount by number of events passed in", async () => {
      let result = await gateway.update(auditLog, { events: [mockDynamoAuditLogEvent(), mockDynamoAuditLogEvent()] })
      expect(result).toNotBeError()

      let updated = (await gateway.fetchOne(auditLog.messageId, {
        includeColumns: ["version", "eventsCount"]
      })) as DynamoAuditLog

      expect(updated.events).toHaveLength(2)
      expect(updated.eventsCount).toBe(2)

      let allEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items
      expect(allEvents).toHaveLength(2)

      result = await gateway.update(updated, { events: [mockDynamoAuditLogEvent(), mockDynamoAuditLogEvent()] })
      expect(result).toNotBeError()

      updated = (await gateway.fetchOne(auditLog.messageId, {
        includeColumns: ["version", "eventsCount"]
      })) as DynamoAuditLog

      expect(updated.events).toHaveLength(4)
      expect(updated.eventsCount).toBe(4)

      allEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items
      expect(allEvents).toHaveLength(4)
    })

    it("should fail when eventsCount is less than number of events in events table", async () => {
      const untrackedEvent = { ...mockDynamoAuditLogEvent({ _messageId: auditLog.messageId }), _id: "event-0" }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, untrackedEvent, "_id")

      auditLog = (await gateway.fetchOne(auditLog.messageId, {
        includeColumns: ["eventsCount", "version"]
      })) as DynamoAuditLog

      const result = await gateway.update(auditLog, { events: [mockDynamoAuditLogEvent()] })
      expect(result).toBeError(
        "Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed]"
      )
    })

    it("should fail when eventsCount is greater than number of events in events table", async () => {
      await testGateway.updateEntry(auditLogDynamoConfig.auditLogTableName, {
        updateExpression: "SET eventsCount = :eventsCount",
        updateExpressionValues: {
          ":eventsCount": 1
        },
        keyName: "messageId",
        keyValue: auditLog.messageId,
        currentVersion: 0
      })

      const result = await gateway.update(auditLog, { events: [mockDynamoAuditLogEvent()] })
      expect(result).toBeError(
        "Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed]"
      )
    })
  })

  describe("Compress and decompress attribute value", () => {
    let auditLog: DynamoAuditLog

    beforeEach(async () => {
      auditLog = await createMockDynamoAuditLog()
    })

    it("should compress attribute values", async () => {
      const events = [mockDynamoAuditLogEvent()]
      const result = await gateway.update(auditLog, { events })
      expect(result).toNotBeError()

      const updated = (
        (await gateway.getOne(
          auditLogDynamoConfig.auditLogTableName,
          gateway.auditLogTableKey,
          auditLog.messageId
        )) as DocumentClient.GetItemOutput
      ).Item!

      expect(updated.events).toBeUndefined()

      const allEvents = (await (
        await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
      ).Items) as ApiAuditLogEvent[]

      expect(allEvents).toHaveLength(1)
      const attribute1 = allEvents[0].attributes?.["Attribute 1"]
      expect(attribute1).toHaveProperty("_compressedValue")

      const decompressedValue = (await decompress(
        (attribute1 as { _compressedValue: string })._compressedValue
      )) as string
      expect(decompressedValue).toBe("Attribute 1 data".repeat(500))
    })

    it("should decompress attribute values", async () => {
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = mockDynamoAuditLogEvent({
        eventType: "Type 1",
        _id: randomUUID(),
        _messageId: auditLog.messageId,
        attributes: {
          "Attribute 1": { _compressedValue: (await compress("Attribute 1 data".repeat(500))) as string }
        }
      })

      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchMany({ limit: 1 })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(1)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[0].attributes).toHaveProperty("Attribute 1", "Attribute 1 data".repeat(500))
    })

    it("should compress event xml", async () => {
      const events = [mockDynamoAuditLogEvent({ eventXml: "really long xml".repeat(500) })]
      const result = await gateway.update(auditLog, { events })
      expect(result).toNotBeError()

      const allEvents = (await (
        await testGateway.getAll(auditLogDynamoConfig.eventsTableName)
      ).Items) as ApiAuditLogEvent[]

      expect(allEvents).toHaveLength(1)
      expect(allEvents[0]).toHaveProperty("eventXml")
      expect(allEvents[0].eventXml).toHaveProperty("_compressedValue")

      const decompressedValue = (await decompress(
        (allEvents[0].eventXml as { _compressedValue: string })._compressedValue
      )) as string
      expect(decompressedValue).toBe("really long xml".repeat(500))
    })

    it("should decompress event xml", async () => {
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = {
        ...mockApiAuditLogEvent(),
        _id: randomUUID(),
        _messageId: auditLog.messageId,
        eventXml: {
          _compressedValue: await compress("really long xml".repeat(500))
        }
      }

      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchMany({ limit: 1 })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(1)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0]).not.toHaveProperty("_compressedValue")
      expect(actualEvents[0].eventXml).toBe("really long xml".repeat(500))
    })
  })
})
