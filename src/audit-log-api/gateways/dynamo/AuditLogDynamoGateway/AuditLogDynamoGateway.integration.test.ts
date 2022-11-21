import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import { addDays } from "date-fns"
import { auditLogDynamoConfig } from "src/audit-log-api/test"
import { compress, decompress } from "src/shared"
import "src/shared/testing"
import { createMockAuditLog, mockApiAuditLogEvent, mockDynamoAuditLog } from "src/shared/testing"
import type { ApiAuditLogEvent, DynamoAuditLog, KeyValuePair } from "src/shared/types"
import { AuditLogStatus, isError } from "src/shared/types"
import TestDynamoGateway from "../../../test/TestDynamoGateway"
import AuditLogDynamoGateway from "./AuditLogDynamoGateway"

const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const primaryKey = "messageId"

describe("AuditLogDynamoGateway", () => {
  beforeEach(async () => {
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

  describe("fetchOne", () => {
    it("should return the matching AuditLog", async () => {
      const expectedAuditLog = mockDynamoAuditLog()
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchOne(expectedAuditLog.messageId)

      expect(isError(result)).toBe(false)

      const actualAuditLog = <DynamoAuditLog>result
      expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
      expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
      expect(actualAuditLog.receivedDate).toBe(expectedAuditLog.receivedDate)
      expect(actualAuditLog.events).toHaveLength(0)
    })

    it("should return null when no AuditLog matches the given messageId", async () => {
      const result = await gateway.fetchOne("InvalidMessageId")

      expect(isError(result)).toBe(false)
      expect(result as DynamoAuditLog).toBeUndefined()
    })

    it("should merge events from both tables for one message", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchOne(auditLog.messageId)

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog
      expect(actualAuditLogs.events).toHaveLength(2)

      const actualEvents = actualAuditLogs.events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchOne(auditLog.messageId, { excludeColumns: ["events"] })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog
      expect(actualAuditLogs.events).toBeUndefined()
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
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )

      const result = await gateway.fetchMany({ limit: 1 })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(1)
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

    it("should merge events from both tables for one message", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchMany({ limit: 1 })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(2)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should merge events from both tables for multiple messages", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = mockDynamoAuditLog({ receivedDate: `2021-06-01T10:11:0${i}` })
          auditLog.events.push(
            mockApiAuditLogEvent({ eventType: `Main event type ${i}`, timestamp: `2021-06-01T10:11:01` })
          )
          await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
          const externalEvent = {
            ...mockApiAuditLogEvent({ timestamp: `2021-06-01T10:11:02` }),
            eventType: `External event type ${i}`,
            _messageId: auditLog.messageId
          }
          await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)
        })
      )

      const result = await gateway.fetchMany()

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(3)
      expect(actualAuditLogs[0].events).toHaveLength(2)
      expect(actualAuditLogs[0].events[0].eventType).toBe("Main event type 2")
      expect(actualAuditLogs[0].events[1].eventType).toBe("External event type 2")

      expect(actualAuditLogs[1].events).toHaveLength(2)
      expect(actualAuditLogs[1].events[0].eventType).toBe("Main event type 1")
      expect(actualAuditLogs[1].events[1].eventType).toBe("External event type 1")

      expect(actualAuditLogs[2].events).toHaveLength(2)
      expect(actualAuditLogs[2].events[0].eventType).toBe("Main event type 0")
      expect(actualAuditLogs[2].events[1].eventType).toBe("External event type 0")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchMany({ limit: 1, excludeColumns: ["events"] })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toBeUndefined()
    })
  })

  describe("fetchRange", () => {
    it("should return limited amount of AuditLogs", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )

      const result = await gateway.fetchRange({ limit: 1, start: new Date("2020-01-01"), end: new Date("2100-01-01") })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(1)
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

    it("should merge events from both tables for one message", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchRange({ limit: 1, start: new Date("2020-01-01"), end: new Date("2100-01-01") })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(2)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should merge events from both tables for multiple messages", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = mockDynamoAuditLog({ receivedDate: `2021-06-01T10:11:0${i}` })
          auditLog.events.push(mockApiAuditLogEvent({ eventType: `Main event type ${i}` }))
          await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
          const externalEvent = {
            ...mockApiAuditLogEvent(),
            eventType: `External event type ${i}`,
            _messageId: auditLog.messageId
          }
          await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)
        })
      )

      const result = await gateway.fetchRange({ start: new Date("2020-01-01"), end: new Date("2100-01-01") })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(3)
      expect(actualAuditLogs[0].events).toHaveLength(2)
      expect(actualAuditLogs[0].events[0].eventType).toBe("Main event type 2")
      expect(actualAuditLogs[0].events[1].eventType).toBe("External event type 2")

      expect(actualAuditLogs[1].events).toHaveLength(2)
      expect(actualAuditLogs[1].events[0].eventType).toBe("Main event type 1")
      expect(actualAuditLogs[1].events[1].eventType).toBe("External event type 1")

      expect(actualAuditLogs[2].events).toHaveLength(2)
      expect(actualAuditLogs[2].events[0].eventType).toBe("Main event type 0")
      expect(actualAuditLogs[2].events[1].eventType).toBe("External event type 0")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchRange({
        limit: 1,
        excludeColumns: ["events"],
        start: new Date("2020-01-01"),
        end: new Date("2100-01-01")
      })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toBeUndefined()
    })

    it("should allow events to be filtered for the automation report", async () => {
      const auditLog = mockDynamoAuditLog()
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent1 = {
        ...mockApiAuditLogEvent(),
        eventType: "Type 1",
        _messageId: auditLog.messageId,
        _automationReport: 0
      }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent1, gateway.eventsTableKey)
      const externalEvent2 = {
        ...mockApiAuditLogEvent(),
        eventType: "Type 2",
        _messageId: auditLog.messageId,
        _automationReport: 1
      }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent2, gateway.eventsTableKey)

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
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          await gateway.create(mockDynamoAuditLog({ externalCorrelationId: `External correlation id ${i}` }))
        })
      )

      const correlationId = "External correlation id 2"
      const result = await gateway.fetchByExternalCorrelationId(correlationId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <DynamoAuditLog>result
      expect(item.externalCorrelationId).toBe(correlationId)
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

    it("should merge events from both tables", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchByExternalCorrelationId(auditLog.externalCorrelationId)

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog
      expect(actualAuditLogs.events).toHaveLength(2)

      const actualEvents = actualAuditLogs.events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchByExternalCorrelationId(auditLog.externalCorrelationId, {
        excludeColumns: ["events"]
      })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog
      expect(actualAuditLogs.events).toBeUndefined()
    })
  })

  describe("fetchByHash", () => {
    it("should return one AuditLog when hash exists in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          await gateway.create(mockDynamoAuditLog({ messageHash: `hash-${i}` }))
        })
      )

      const hash = "hash-2"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <DynamoAuditLog>result
      expect(item.messageHash).toBe(hash)
    })

    it("should return null when hash does not exist in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )

      const hash = "Hash does not exist"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(false)
      expect(<DynamoAuditLog>result).toBeNull()
    })

    it("should merge events from both tables", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchByHash(auditLog.messageHash)

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog
      expect(actualAuditLogs.events).toHaveLength(2)

      const actualEvents = actualAuditLogs.events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })
  })

  describe("fetchByStatus", () => {
    it("should return one AuditLog when there is a record with Completed status", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          await gateway.create(mockDynamoAuditLog())
        })
      )
      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.status).toBe(expectedAuditLog.status)
    })

    it("should merge events from both tables for one message", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.status = AuditLogStatus.completed
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(2)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should merge events from both tables for multiple messages", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = mockDynamoAuditLog({
            status: AuditLogStatus.completed,
            receivedDate: `2021-06-01T10:11:0${i}`
          })
          auditLog.status = AuditLogStatus.completed
          auditLog.events.push(mockApiAuditLogEvent({ eventType: `Main event type ${i}` }))
          await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
          const externalEvent = {
            ...mockApiAuditLogEvent(),
            eventType: `External event type ${i}`,
            _messageId: auditLog.messageId
          }
          await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)
        })
      )

      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(3)
      expect(actualAuditLogs[0].events).toHaveLength(2)
      expect(actualAuditLogs[0].events[0].eventType).toBe("Main event type 2")
      expect(actualAuditLogs[0].events[1].eventType).toBe("External event type 2")

      expect(actualAuditLogs[1].events).toHaveLength(2)
      expect(actualAuditLogs[1].events[0].eventType).toBe("Main event type 1")
      expect(actualAuditLogs[1].events[1].eventType).toBe("External event type 1")

      expect(actualAuditLogs[2].events).toHaveLength(2)
      expect(actualAuditLogs[2].events[0].eventType).toBe("Main event type 0")
      expect(actualAuditLogs[2].events[1].eventType).toBe("External event type 0")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.status = AuditLogStatus.completed
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchByStatus(AuditLogStatus.completed, { excludeColumns: ["events"] })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toBeUndefined()
    })
  })

  describe("fetchUnsanitised", () => {
    it("should return one AuditLog when there is an unsanitised record to check", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async () => {
          const auditLog = mockDynamoAuditLog({ isSanitised: 1 })
          auditLog.isSanitised = 1
          await gateway.create(auditLog)
        })
      )

      const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.completed })
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <DynamoAuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.isSanitised).toBeFalsy()
      expect(item.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
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

    it("should merge events from both tables for one message", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.isSanitised = 0
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchUnsanitised()

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toHaveLength(2)

      const actualEvents = actualAuditLogs[0].events
      expect(actualEvents[0].eventType).toBe("Type 1")
      expect(actualEvents[1].eventType).toBe("Type 2")
    })

    it("should merge events from both tables for multiple messages", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = mockDynamoAuditLog({
            externalCorrelationId: `External correlation id ${i}`,
            receivedDate: `2021-06-01T10:11:0${i}`,
            messageHash: `hash-${i}`
          })
          auditLog.isSanitised = 0
          auditLog.events.push(
            mockApiAuditLogEvent({ eventType: `Main event type ${i}`, timestamp: "2021-06-01T10:11:01" })
          )
          await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
          const externalEvent = {
            ...mockApiAuditLogEvent(),
            eventType: `External event type ${i}`,
            _messageId: auditLog.messageId,
            timestamp: "2021-06-01T10:11:02"
          }
          await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)
        })
      )

      const result = await gateway.fetchUnsanitised()

      expect(result).toNotBeError()

      const actualAuditLogs = (result as DynamoAuditLog[]).sort((a, b) => a.receivedDate.localeCompare(b.receivedDate))
      expect(actualAuditLogs).toHaveLength(3)

      expect(actualAuditLogs[0].events).toHaveLength(2)
      expect(actualAuditLogs[0].events[0].eventType).toBe("Main event type 0")
      expect(actualAuditLogs[0].events[1].eventType).toBe("External event type 0")

      expect(actualAuditLogs[1].events).toHaveLength(2)
      expect(actualAuditLogs[1].events[0].eventType).toBe("Main event type 1")
      expect(actualAuditLogs[1].events[1].eventType).toBe("External event type 1")

      expect(actualAuditLogs[2].events).toHaveLength(2)
      expect(actualAuditLogs[2].events[0].eventType).toBe("Main event type 2")
      expect(actualAuditLogs[2].events[1].eventType).toBe("External event type 2")
    })

    it("should not merge events if the column was excluded", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.isSanitised = 0
      auditLog.events.push(mockApiAuditLogEvent({ eventType: "Type 1" }))
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 2", _messageId: auditLog.messageId }
      await testGateway.insertOne(auditLogDynamoConfig.eventsTableName, externalEvent, gateway.eventsTableKey)

      const result = await gateway.fetchUnsanitised({ excludeColumns: ["events"] })

      expect(result).toNotBeError()

      const actualAuditLogs = result as DynamoAuditLog[]
      expect(actualAuditLogs).toHaveLength(1)
      expect(actualAuditLogs[0].events).toBeUndefined()
    })
  })

  describe("fetchEvents", () => {
    it("should return AuditLogEvents when message id exists in the table", async () => {
      const auditLog = mockDynamoAuditLog()
      auditLog.events = [
        mockApiAuditLogEvent({ eventType: "Event 1", timestamp: "2021-06-10T10:12:13" }),
        mockApiAuditLogEvent({ eventType: "Event 2", timestamp: "2021-06-15T10:12:13" }),
        mockApiAuditLogEvent({ eventType: "Event 3", timestamp: "2021-06-13T10:12:13" })
      ]
      await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

      const result = await gateway.fetchEvents(auditLog.messageId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const events = <ApiAuditLogEvent[]>result
      expect(events).toHaveLength(3)
      expect(events[0].eventType).toBe("Event 1")
      expect(events[1].eventType).toBe("Event 3")
      expect(events[2].eventType).toBe("Event 2")
    })

    it("should return an empty array when message does not have events", async () => {
      const auditLog = mockDynamoAuditLog()
      await gateway.create(auditLog)

      const result = await gateway.fetchEvents(auditLog.messageId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const events = <ApiAuditLogEvent[]>result
      expect(events).toHaveLength(0)
    })

    it("should throw error when message id does not exist in the table", async () => {
      const messageId = "Message Id does not exist"
      const result = await gateway.fetchEvents(messageId)

      expect(isError(result)).toBe(true)

      const error = <Error>result
      expect(error.message).toBe(`Couldn't get events for message '${messageId}'.`)
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
      const events = [mockApiAuditLogEvent()]
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

      const allEvents = await (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items
      expect(allEvents).toHaveLength(1)
    })
  })

  describe("Compress and decompress attribute value", () => {
    let auditLog: DynamoAuditLog

    beforeEach(async () => {
      auditLog = (await createMockAuditLog()) as DynamoAuditLog
    })

    it("should compress attribute values", async () => {
      const events = [mockApiAuditLogEvent()]
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
      const attribute1 = allEvents[0].attributes["Attribute 1"]
      expect(attribute1).toHaveProperty("_compressedValue")

      const decompressedValue = (await decompress(
        (attribute1 as { _compressedValue: string })._compressedValue
      )) as string
      expect(decompressedValue).toBe("Attribute 1 data".repeat(500))
    })

    it("should decompress attribute values", async () => {
      await testGateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
      const externalEvent = { ...mockApiAuditLogEvent(), eventType: "Type 1", _messageId: auditLog.messageId }
      externalEvent.attributes["Attribute 1"] = {
        _compressedValue: (await compress(externalEvent.attributes["Attribute 1"] as string)) as string
      }
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
      const events = [mockApiAuditLogEvent({ eventXml: "really long xml".repeat(500) })]
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
