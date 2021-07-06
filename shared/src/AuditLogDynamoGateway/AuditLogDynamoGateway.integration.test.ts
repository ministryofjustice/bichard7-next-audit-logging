import { DocumentClient } from "aws-sdk/clients/dynamodb"
import AuditLogStatus from "../AuditLogStatus"
import { isError } from "../types"
import AuditLog from "../AuditLog"
import { DynamoDbConfig } from "../DynamoGateway"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AuditLogDynamoGateway from "./AuditLogDynamoGateway"
import { AuditLogEvent } from ".."

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "TestAuditLog"
}

const gateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const testGateway = new TestDynamoGateway(config)
const primaryKey = "messageId"
const sortKey = "receivedDate"

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

    await testGateway.createTable(config.AUDIT_LOG_TABLE_NAME, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, primaryKey)
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = new AuditLog("ExpectedMessage", new Date(), "XML")

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <AuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
      expect(actualMessage.messageXml).toBe(expectedMessage.messageXml)
    })

    it("should return an error when the given message already exists", async () => {
      const message = new AuditLog("one", new Date(), "XML")
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })
  })

  describe("addEvent()", () => {
    it("should only add an event to and update the status of the specified audit log", async () => {
      const expectedEvent = new AuditLogEvent("information", new Date(), "PNC Response received")
      expectedEvent.eventSource = "Test event source"
      const expectedEventAttributes = {
        "Attribute one": "Some value",
        "Attribute two": 2
      }
      expectedEvent.attributes = expectedEventAttributes

      const message = new AuditLog("one", new Date(), "XML1")
      const otherMessage = new AuditLog("two", new Date(), "XML2")
      await gateway.create(message)
      await gateway.create(otherMessage)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, sortKey, 2)

      const actualOtherMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === otherMessage.messageId)
      expect(actualOtherMessage).toBeDefined()
      expect(actualOtherMessage.events).toBeDefined()
      expect(actualOtherMessage.events).toHaveLength(0)
      expect(actualOtherMessage.status).toBe(otherMessage.status)

      const actualMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === message.messageId)
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(1)
      expect(actualMessage.status).toBe(AuditLogStatus.completed)

      const actualEvent = actualMessage.events[0]
      expect(actualEvent.eventSource).toBe(expectedEvent.eventSource)
      expect(actualEvent.category).toBe(expectedEvent.category)
      expect(actualEvent.timestamp).toBe(expectedEvent.timestamp)
      expect(actualEvent.eventType).toBe(expectedEvent.eventType)

      const actualEventAttributes = actualEvent.attributes
      expect(actualEventAttributes).toBeDefined()
      expect(actualEventAttributes["Attribute one"]).toBe("Some value")
      expect(actualEventAttributes["Attribute two"]).toBe(2)
    })

    it("should add two events to the audit log and update the message status to the latest event type", async () => {
      const expectedEventOne = new AuditLogEvent("information", new Date(), "Test event one")
      expectedEventOne.eventSource = "Event source one"
      expectedEventOne.attributes = { EventOneAttribute: "Event one attribute" }
      const expectedEventTwo = new AuditLogEvent("error", new Date(), "PNC Response not received")
      expectedEventTwo.eventSource = "Event source two"
      expectedEventTwo.attributes = { EventTwoAttribute: "Event two attribute" }

      let message = new AuditLog("one", new Date(), "XML")
      await gateway.create(message)

      const resultOne = await gateway.addEvent(message.messageId, message.version, expectedEventOne)
      expect(isError(resultOne)).toBe(false)

      message = (await gateway.fetchOne(message.messageId)) as AuditLog
      const resultTwo = await gateway.addEvent(message.messageId, message.version, expectedEventTwo)
      expect(isError(resultTwo)).toBe(false)

      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.AUDIT_LOG_TABLE_NAME, sortKey, 1)

      const actualMessage = <AuditLog>actualRecords.Items?.find((r) => r.messageId === message.messageId)
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(2)
      expect(actualMessage.status).toBe(AuditLogStatus.error)
      expect(actualMessage.lastEventType).toBe(expectedEventTwo.eventType)

      const actualEventOne = actualMessage.events.find((e) => e.eventSource === expectedEventOne.eventSource)
      expect(actualEventOne?.eventSource).toBe(expectedEventOne.eventSource)
      expect(actualEventOne?.category).toBe(expectedEventOne.category)
      expect(actualEventOne?.timestamp).toBe(expectedEventOne.timestamp)
      expect(actualEventOne?.eventType).toBe(expectedEventOne.eventType)

      const actualEventOneAttributes = actualEventOne?.attributes
      expect(actualEventOneAttributes).toBeDefined()
      expect(actualEventOneAttributes?.EventOneAttribute).toBe(expectedEventOne.attributes.EventOneAttribute)

      const actualEventTwo = actualMessage.events.find((e) => e.eventSource === expectedEventTwo.eventSource)
      expect(actualEventTwo?.eventSource).toBe(expectedEventTwo.eventSource)
      expect(actualEventTwo?.category).toBe(expectedEventTwo.category)
      expect(actualEventTwo?.timestamp).toBe(expectedEventTwo.timestamp)
      expect(actualEventTwo?.eventType).toBe(expectedEventTwo.eventType)

      const actualEventTwoAttributes = actualEventTwo?.attributes
      expect(actualEventTwoAttributes).toBeDefined()
      expect(actualEventTwoAttributes?.EventTwoAttribute).toBe(expectedEventTwo.attributes.EventTwoAttribute)
    })

    it("should return error when audit log does not exist", async () => {
      const event = new AuditLogEvent("information", new Date(), "Test event one")
      const { messageId, version } = new AuditLog("External correlation id", new Date(), "Xml")

      const resultOne = await gateway.addEvent(messageId, version, event)

      expect(isError(resultOne)).toBe(true)
    })
  })

  describe("fetchOne", () => {
    it("should return the matching AuditLog", async () => {
      const expectedAuditLog = new AuditLog("ExternalCorrelationId", new Date(), "XML")
      await gateway.create(expectedAuditLog)

      const result = await gateway.fetchOne(expectedAuditLog.messageId)

      expect(isError(result)).toBe(false)

      const actualAuditLog = <AuditLog>result
      expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
      expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
      expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
      expect(actualAuditLog.messageXml).toBe(expectedAuditLog.messageXml)
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
      const expectedAuditLog = new AuditLog("ExternalCorrelationId", new Date(), "XML")
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
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), "XML")
          await gateway.create(auditLog)
        })
      )

      const result = await gateway.fetchMany(1)

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
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(dateString), "XML")
          await gateway.create(auditLog)
        })
      )

      const result = await gateway.fetchMany(3)

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
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), "XML")
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
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), "XML")
          await gateway.create(auditLog)
        })
      )

      const externalCorrelationId = "External correlation id does not exist"
      const result = await gateway.fetchByExternalCorrelationId(externalCorrelationId)

      expect(isError(result)).toBe(false)
      expect(<AuditLog>result).toBeNull()
    })
  })

  describe("fetchByStatus", () => {
    it("should return one AuditLog when there is a record with Completed status", async () => {
      await Promise.allSettled(
        [...Array(3).keys()].map(async (i: number) => {
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(), "XML")
          await gateway.create(auditLog)
        })
      )
      const expectedAuditLog = new AuditLog(`External correlation id`, new Date(), "XML")
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

  describe("fetchEvents", () => {
    it("should return AuditLogEvents ordered by timestamp when message id exists in the table", async () => {
      const auditLog = new AuditLog(`External correlation id 1`, new Date(), "XML")
      auditLog.events = [
        new AuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 1"),
        new AuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2"),
        new AuditLogEvent("information", new Date("2021-06-13T10:12:13"), "Event 3")
      ]
      await gateway.create(auditLog)

      const result = await gateway.fetchEvents(auditLog.messageId)

      expect(isError(result)).toBe(false)
      expect(result).toBeDefined()

      const events = <AuditLogEvent[]>result
      expect(events).toHaveLength(3)
      expect(events[0].eventType).toBe("Event 2")
      expect(events[1].eventType).toBe("Event 3")
      expect(events[2].eventType).toBe("Event 1")
    })

    it("should return an empty array when message does not have events", async () => {
      const auditLog = new AuditLog(`External correlation id 1`, new Date(), "XML")
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
})
