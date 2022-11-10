jest.retryTimes(10)
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { addDays } from "date-fns"
import { auditLogDynamoConfig } from "src/audit-log-api/test"
import "src/shared/testing"
import { createMockAuditLog, mockAuditLogEvent } from "src/shared/testing"
import type { AuditLogEventOptions, KeyValuePair } from "src/shared/types"
import { AuditLog, AuditLogEvent, AuditLogStatus, isError } from "src/shared/types"
import TestDynamoGateway from "../../../test/TestDynamoGateway"
import AuditLogDynamoGateway from "./AuditLogDynamoGateway"

const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const primaryKey = "messageId"
const sortKey = "receivedDate"

const createAuditLogEvent = (options: Partial<AuditLogEventOptions> = {}) =>
  new AuditLogEvent({
    category: options.category ?? "information",
    timestamp: options.timestamp ?? new Date(),
    eventType: options.eventType ?? "Dummy Event Type",
    eventCode: options.eventCode ?? "dummy.event.code",
    eventSource: options.eventSource ?? "Test"
  })

describe("AuditLogDynamoGateway", () => {
  beforeAll(async () => {
    const options = {
      keyName: primaryKey,
      sortKey,
      secondaryIndexes: [
        {
          name: "externalCorrelationIdIndex",
          hashKey: "externalCorrelationId"
        },
        {
          name: "statusIndex",
          hashKey: "status",
          rangeKey: "receivedDate"
        }
      ],
      skipIfExists: true
    }

    await testGateway.createTable(auditLogDynamoConfig.auditLogTableName, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, primaryKey)
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = new AuditLog("ExpectedMessage", new Date(), "dummy hash")

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <AuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessage.expiryTime).toBeUndefined()
    })

    it("should return an error when the given message already exists", async () => {
      const message = new AuditLog("one", new Date(), "dummy hash")
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })

    it("should set an expiry time of ~1 week in the E2E environment", async () => {
      const expectedMessage = new AuditLog("E2EMessage", new Date(), "dummy hash")

      process.env.IS_E2E = "true"
      const result = await gateway.create(expectedMessage)
      delete process.env.IS_E2E

      expect(isError(result)).toBe(false)

      const actualMessage = <AuditLog>result
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
      const expectedMessage = new AuditLog("ExpectedMessage", new Date(), "dummy hash")

      const result = await gateway.createMany([expectedMessage])

      expect(isError(result)).toBe(false)

      const actualMessages = <AuditLog[]>result
      expect(actualMessages).toHaveLength(1)
      expect(actualMessages[0].messageId).toBe(expectedMessage.messageId)
      expect(actualMessages[0].receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessages[0].expiryTime).toBeUndefined()
    })

    it("should return an error when the given message already exists", async () => {
      const messages = new Array(10).fill(0).map(() => new AuditLog("one", new Date(), "dummy hash"))
      await gateway.create(messages[4])

      const result = await gateway.createMany(messages)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toContain("ConditionalCheckFailed")
    })

    it("should set an expiry time of ~1 week in the E2E environment", async () => {
      const expectedMessage = new AuditLog("E2EMessage", new Date(), "dummy hash")

      process.env.IS_E2E = "true"
      const result = await gateway.createMany([expectedMessage])
      delete process.env.IS_E2E

      expect(isError(result)).toBe(false)

      const actualMessages = <AuditLog[]>result
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
      const expectedAuditLog = new AuditLog("ExternalCorrelationId", new Date(), `dummy hash`)
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchOne(expectedAuditLog.messageId)

      expect(isError(result)).toBe(false)

      const actualAuditLog = <AuditLog>result
      expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
      expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
      expect(actualAuditLog.receivedDate).toBe(expectedAuditLog.receivedDate)
      expect(actualAuditLog.events).toHaveLength(0)
    })

    it("should return null when no AuditLog matches the given messageId", async () => {
      const result = await gateway.fetchOne("InvalidMessageId")

      expect(isError(result)).toBe(false)
      expect(result as AuditLog).toBeUndefined()
    })
  })

  describe("fetchVersion", () => {
    it("should return the version of the matching AuditLog", async () => {
      const expectedAuditLog = new AuditLog("ExternalCorrelationId", new Date(), `dummy hash`)
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
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const result = await gateway.fetchMany({ limit: 1 })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(1)
    })

    it("should return AuditLogs ordered by receivedDate", async () => {
      const receivedDates = ["2021-06-01T10:11:12", "2021-06-05T10:11:12", "2021-06-03T10:11:12"]
      const expectedReceivedDates = receivedDates
        .map((dateString: string) => new Date(dateString).toISOString())
        .sort()
        .reverse()

      await Promise.allSettled(
        receivedDates.map(async (dateString: string, i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(dateString), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const result = await gateway.fetchMany({ limit: 3 })

      expect(isError(result)).toBe(false)
      expect(result).toHaveLength(3)

      const actualAuditLogs = <AuditLog[]>result

      expect(actualAuditLogs).toBeDefined()
      expect(actualAuditLogs[0].receivedDate).toBe(expectedReceivedDates[0])
      expect(actualAuditLogs[1].receivedDate).toBe(expectedReceivedDates[1])
      expect(actualAuditLogs[2].receivedDate).toBe(expectedReceivedDates[2])
    })
  })

  describe("fetchByExternalCorrelationId", () => {
    it("should return one AuditLog when external correlation id exists in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const correlationId = "External correlation id 2"
      const result = await gateway.fetchByExternalCorrelationId(correlationId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <AuditLog>result
      expect(item.externalCorrelationId).toBe(correlationId)
    })

    it("should throw error when external correlation id does not exist in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const externalCorrelationId = "External correlation id does not exist"
      const result = await gateway.fetchByExternalCorrelationId(externalCorrelationId)

      expect(isError(result)).toBe(false)
      expect(<AuditLog>result).toBeNull()
    })
  })

  describe("fetchByHash", () => {
    it("should return one AuditLog when hash exists in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const hash = "hash-2"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const item = <AuditLog>result
      expect(item.messageHash).toBe(hash)
    })

    it("should throw error when hash does not exist in the table", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), `hash-${i}`)
          await gateway.create(auditLog)
        })
      )

      const hash = "Hash does not exist"
      const result = await gateway.fetchByHash(hash)

      expect(isError(result)).toBe(false)
      expect(<AuditLog>result).toBeNull()
    })
  })

  describe("fetchByStatus", () => {
    it("should return one AuditLog when there is a record with Completed status", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), "dummy hash")
          await gateway.create(auditLog)
        })
      )
      const expectedAuditLog = new AuditLog(`External correlation id`, new Date(), "dummy hash")
      expectedAuditLog.status = AuditLogStatus.completed
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchByStatus(AuditLogStatus.completed)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <AuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.status).toBe(expectedAuditLog.status)
    })
  })

  describe("fetchUnsanitised", () => {
    it("should return one AuditLog when there is an unsanitised record to check", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(
            `External correlation id ${i}`,
            new Date("2021-05-06T06:13:27+0000"),
            "dummy hash"
          )
          auditLog.isSanitised = 1
          await gateway.create(auditLog)
        })
      )

      const expectedAuditLog = new AuditLog(
        `External correlation id 4`,
        new Date("2021-05-06T06:13:27+0000"),
        "dummy hash"
      )
      expectedAuditLog.status = AuditLogStatus.completed
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <AuditLog[]>result
      expect(items).toHaveLength(1)

      const item = items[0]
      expect(item.isSanitised).toBeFalsy()
      expect(item.externalCorrelationId).toBe("External correlation id 4")
    })

    it("shouldn't return any AuditLogs with unsanitised records not due to be checked", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(
            `External correlation id ${i}`,
            new Date("2021-05-06T06:13:27+0000"),
            "dummy hash"
          )
          auditLog.isSanitised = 1
          await gateway.create(auditLog)
        })
      )

      const expectedAuditLog = new AuditLog(
        `External correlation id 4`,
        new Date("2021-05-06T06:13:27+0000"),
        "dummy hash"
      )
      expectedAuditLog.nextSanitiseCheck = addDays(new Date(), 1).toISOString()
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchUnsanitised()

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const items = <AuditLog[]>result
      expect(items).toHaveLength(0)
    })
  })

  describe("fetchEvents", () => {
    it("should return AuditLogEvents when message id exists in the table", async () => {
      const auditLog = new AuditLog(`External correlation id 1`, new Date(), "dummy hash")
      auditLog.events = [
        createAuditLogEvent({ eventType: "Event 1", timestamp: new Date("2021-06-10T10:12:13") }),
        createAuditLogEvent({ eventType: "Event 2", timestamp: new Date("2021-06-15T10:12:13") }),
        createAuditLogEvent({ eventType: "Event 3", timestamp: new Date("2021-06-13T10:12:13") })
      ]
      await gateway.create(auditLog)

      const result = await gateway.fetchEvents(auditLog.messageId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const events = <AuditLogEvent[]>result
      expect(events).toHaveLength(3)
      expect(events[0].eventType).toBe("Event 1")
      expect(events[1].eventType).toBe("Event 2")
      expect(events[2].eventType).toBe("Event 3")
    })

    it("should return an empty array when message does not have events", async () => {
      const auditLog = new AuditLog(`External correlation id 1`, new Date(), "dummy hash")
      await gateway.create(auditLog)

      const result = await gateway.fetchEvents(auditLog.messageId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const events = <AuditLogEvent[]>result
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

  describe.only("update()", () => {
    let auditLog: AuditLog

    beforeEach(async () => {
      auditLog = (await createMockAuditLog()) as AuditLog
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
    ] as [string, Partial<AuditLog>][])(
      "should update the %s if it is passed in",
      async (key: string, updates: Partial<AuditLog>) => {
        const result = await gateway.update(auditLog, updates)
        expect(result).toNotBeError()

        const updated = (
          (await gateway.getOne(
            auditLogDynamoConfig.auditLogTableName,
            gateway.auditLogTableKey,
            auditLog.messageId
          )) as DocumentClient.GetItemOutput
        ).Item!

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

    it.only("should add events to the events table if they are passed in", async () => {
      const events = [mockAuditLogEvent()]
      const result = await gateway.update(auditLog, { events })
      expect(result).toNotBeError()

      const updated = (
        (await gateway.getOne(
          auditLogDynamoConfig.auditLogTableName,
          gateway.auditLogTableKey,
          auditLog.messageId
        )) as DocumentClient.GetItemOutput
      ).Item!

      expect(updated.events).toHaveLength(0)

      const allEvents = await (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items
      expect(allEvents).toHaveLength(1)
    })
  })
})
