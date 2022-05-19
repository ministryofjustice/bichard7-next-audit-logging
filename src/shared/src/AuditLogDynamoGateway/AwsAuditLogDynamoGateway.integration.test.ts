jest.retryTimes(10)
import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import { addDays } from "date-fns"
import "shared-testing"
import type { DynamoDbConfig, EventCategory } from "shared-types"
import { AuditLog, AuditLogEvent, AuditLogStatus, EventType, isError } from "shared-types"
import TestDynamoGateway from "../DynamoGateway/TestDynamoGateway"
import AwsAuditLogDynamoGateway from "./AwsAuditLogDynamoGateway"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const gateway = new AwsAuditLogDynamoGateway(config, config.TABLE_NAME)
const testGateway = new TestDynamoGateway(config)
const primaryKey = "messageId"
const sortKey = "receivedDate"

const createAuditLogEvent = (
  category: EventCategory,
  timestamp: Date,
  eventType: string,
  eventSource?: string
): AuditLogEvent =>
  new AuditLogEvent({
    category,
    timestamp,
    eventType,
    eventSource: eventSource || "Test"
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

    await testGateway.createTable(config.TABLE_NAME, options)
  })

  beforeEach(async () => {
    await testGateway.deleteAll(config.TABLE_NAME, primaryKey)
  })

  describe("create()", () => {
    it("should insert the given message", async () => {
      const expectedMessage = new AuditLog("ExpectedMessage", new Date(), "dummy hash")

      const result = await gateway.create(expectedMessage)

      expect(isError(result)).toBe(false)

      const actualMessage = <AuditLog>result
      expect(actualMessage.messageId).toBe(expectedMessage.messageId)
      expect(actualMessage.receivedDate).toBe(expectedMessage.receivedDate)
    })

    it("should return an error when the given message already exists", async () => {
      const message = new AuditLog("one", new Date(), "dummy hash")
      await gateway.create(message)

      const result = await gateway.create(message)

      expect(isError(result)).toBe(true)

      const actualError = <Error>result
      expect(actualError.message).toBe("The conditional request failed")
    })
  })

  describe("addEvent()", () => {
    it("should only add an event to and update the status of the specified audit log", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.RecordIgnoredNoOffences)

      expectedEvent.addAttribute("Attribute one", "Some value")
      expectedEvent.addAttribute("Attribute two", 2)

      const message = new AuditLog("one", new Date(), "dummy hash")
      const otherMessage = new AuditLog("two", new Date(), "dummy hash")

      await gateway.create(message)
      await gateway.create(otherMessage)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

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
      const expectedEventOne = createAuditLogEvent("information", new Date(), "Test event one", "Event source one")
      expectedEventOne.addAttribute("EventOneAttribute", "Event one attribute")

      const expectedEventTwo = createAuditLogEvent("error", new Date(), "PNC Response not received", "Event source two")
      expectedEventTwo.addAttribute("EventTwoAttribute", "Event two attribute")

      let message = new AuditLog("one", new Date(), "dummy hash")
      await gateway.create(message)

      const resultOne = await gateway.addEvent(message.messageId, message.version, expectedEventOne)
      expect(isError(resultOne)).toBe(false)

      message = (await gateway.fetchOne(message.messageId)) as AuditLog
      const resultTwo = await gateway.addEvent(message.messageId, message.version, expectedEventTwo)
      expect(isError(resultTwo)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 1 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

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
      const event = createAuditLogEvent("information", new Date(), "Test event one")
      const { messageId, version } = new AuditLog("External correlation id", new Date(), "dummy hash")

      const resultOne = await gateway.addEvent(messageId, version, event)

      expect(isError(resultOne)).toBe(true)
    })

    it("should log the event for top exceptions report", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), "Event for top exceptions report")

      expectedEvent.addAttribute("Message Type", "SPIResults")
      expectedEvent.addAttribute("Error 2 Details", "Dummy")

      const message = new AuditLog("one", new Date(), "dummy hash")

      await gateway.create(message)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

      const actualMessage = actualRecords.Items?.find((r) => r.messageId === message.messageId) as AuditLog & {
        topExceptionsReportEvents: AuditLogEvent[]
      }
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(1)
      expect(actualMessage.topExceptionsReport).toBeDefined()
      expect(actualMessage.topExceptionsReport.events).toBeDefined()
      expect(actualMessage.topExceptionsReport.events).toHaveLength(1)

      const actualEvent = actualMessage.events[0]
      expect(actualEvent.eventSource).toBe(expectedEvent.eventSource)
      expect(actualEvent.category).toBe(expectedEvent.category)
      expect(actualEvent.timestamp).toBe(expectedEvent.timestamp)
      expect(actualEvent.eventType).toBe(expectedEvent.eventType)

      const actualEventAttributes = actualEvent.attributes
      expect(actualEventAttributes).toBeDefined()
      expect(actualEventAttributes["Message Type"]).toBe("SPIResults")
      expect(actualEventAttributes["Error 2 Details"]).toBe("Dummy")

      const actualTopExceptionReportEvent = actualMessage.topExceptionsReport.events[0]
      expect(actualTopExceptionReportEvent.eventSource).toBe(expectedEvent.eventSource)
      expect(actualTopExceptionReportEvent.category).toBe(expectedEvent.category)
      expect(actualTopExceptionReportEvent.timestamp).toBe(expectedEvent.timestamp)
      expect(actualTopExceptionReportEvent.eventType).toBe(expectedEvent.eventType)

      const actualTopExceptionReportEventAttribute = actualTopExceptionReportEvent.attributes
      expect(actualTopExceptionReportEventAttribute).toBeDefined()
      expect(actualTopExceptionReportEventAttribute["Message Type"]).toBe("SPIResults")
      expect(actualTopExceptionReportEventAttribute["Error 2 Details"]).toBe("Dummy")
    })

    it("should log the event for automation report", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), "Hearing Outcome passed to Error List")

      const message = new AuditLog("one", new Date(), "dummy hash")

      await gateway.create(message)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

      const actualMessage = actualRecords.Items?.find((r) => r.messageId === message.messageId) as AuditLog & {
        automationReportEvents: AuditLogEvent[]
      }
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(1)
      expect(actualMessage.automationReport).toBeDefined()
      expect(actualMessage.automationReport.events).toBeDefined()
      expect(actualMessage.automationReport.events).toHaveLength(1)

      const actualEvent = actualMessage.events[0]
      expect(actualEvent.eventSource).toBe(expectedEvent.eventSource)
      expect(actualEvent.category).toBe(expectedEvent.category)
      expect(actualEvent.timestamp).toBe(expectedEvent.timestamp)
      expect(actualEvent.eventType).toBe(expectedEvent.eventType)

      const actualAutomationReportEvent = actualMessage.automationReport.events[0]
      expect(actualAutomationReportEvent.eventSource).toBe(expectedEvent.eventSource)
      expect(actualAutomationReportEvent.category).toBe(expectedEvent.category)
      expect(actualAutomationReportEvent.timestamp).toBe(expectedEvent.timestamp)
      expect(actualAutomationReportEvent.eventType).toBe(expectedEvent.eventType)
    })

    it("should log the force owner for the automated report", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), "Input message received")
      expectedEvent.addAttribute("Force Owner", "DummyForceOwner")

      const message = new AuditLog("one", new Date(), "dummy hash")

      await gateway.create(message)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

      const actualMessage = actualRecords.Items?.find((r) => r.messageId === message.messageId) as AuditLog & {
        automationReportEvents: AuditLogEvent[]
      }
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(1)
      expect(actualMessage.automationReport).toBeDefined()
      expect(actualMessage.automationReport.forceOwner).toBe("DummyForceOwner")
    })

    it("should not log the event for report", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), "Dummy event type")

      const message = new AuditLog("one", new Date(), "dummy hash")

      await gateway.create(message)

      const result = await gateway.addEvent(message.messageId, message.version, expectedEvent)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

      const actualMessage = actualRecords.Items?.find((r) => r.messageId === message.messageId) as AuditLog & {
        topExceptionsReportEvents: AuditLogEvent[]
        automationReportEvents: AuditLogEvent[]
      }
      expect(actualMessage).toBeDefined()
      expect(actualMessage.events).toBeDefined()
      expect(actualMessage.events).toHaveLength(1)
      expect(actualMessage.topExceptionsReport).toBeDefined()
      expect(actualMessage.topExceptionsReport.events).toHaveLength(0)
      expect(actualMessage.automationReport).toBeDefined()
      expect(actualMessage.automationReport.events).toHaveLength(0)
    })

    it("should increment the retry count for retry message", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), "Retrying failed message")

      const message = new AuditLog("one", new Date(), `dummy hash`)

      await gateway.create(message)

      await gateway.addEvent(message.messageId, message.version, expectedEvent)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog.retryCount).toBe(1)
    })

    it("should update the message status", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.Retrying)

      const message = new AuditLog("one", new Date(), `dummy hash`)

      await gateway.create(message)

      await gateway.addEvent(message.messageId, message.version, expectedEvent)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog.status).toBe(AuditLogStatus.retrying)
    })

    it("should not change the status and should set error record archival date", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.ErrorRecordArchival)

      const message = new AuditLog("one", new Date(), `dummy hash`)

      await gateway.create(message)

      await gateway.addEvent(message.messageId, message.version, expectedEvent)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog.errorRecordArchivalDate).toBe(expectedEvent.timestamp)
      expect(actualAuditLog.status).toBe(AuditLogStatus.processing)
    })

    it("should not change the status and should set sanitised date", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.SanitisedMessage)

      const message = new AuditLog("one", new Date(), `dummy hash`)

      await gateway.create(message)

      await gateway.addEvent(message.messageId, message.version, expectedEvent)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog.isSanitised).toBeTruthy()
      expect(actualAuditLog.status).toBe(AuditLogStatus.processing)
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
          const auditLog = new AuditLog(`External correlation id ${i}`, new Date(dateString), `hash-${i}`)
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
        createAuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 1"),
        createAuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2"),
        createAuditLogEvent("information", new Date("2021-06-13T10:12:13"), "Event 3")
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

  describe("update()", () => {
    it("should calculate the status and update the record", async () => {
      const event = createAuditLogEvent("information", new Date(), EventType.RecordIgnoredNoOffences)

      event.addAttribute("Attribute one", "Some value")
      event.addAttribute("Attribute two", 2)

      const message = new AuditLog("one", new Date(), "dummy hash")
      message.status = AuditLogStatus.processing
      const otherMessage = new AuditLog("two", new Date(), "dummy hash")

      await gateway.create(message)
      await gateway.create(otherMessage)

      const amendedMessage = {
        ...message,
        events: [event]
      }
      const result = await gateway.update(amendedMessage)

      expect(isError(result)).toBe(false)

      const getManyOptions = {
        sortKey,
        pagination: { limit: 2 }
      }
      const actualRecords = <DocumentClient.ScanOutput>await gateway.getMany(config.TABLE_NAME, getManyOptions)

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
      expect(actualEvent.eventSource).toBe(event.eventSource)
      expect(actualEvent.category).toBe(event.category)
      expect(actualEvent.timestamp).toBe(event.timestamp)
      expect(actualEvent.eventType).toBe(event.eventType)

      const actualEventAttributes = actualEvent.attributes
      expect(actualEventAttributes).toBeDefined()
      expect(actualEventAttributes["Attribute one"]).toBe("Some value")
      expect(actualEventAttributes["Attribute two"]).toBe(2)
    })

    it("should not change the status and should set error record archival date", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.ErrorRecordArchival)

      const now = new Date()
      const message = new AuditLog("one", now, `dummy hash`)

      await gateway.create(message)

      message.events.push(expectedEvent)
      await gateway.update(message)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog).toHaveProperty("isSanitised")
      expect(actualAuditLog.isSanitised).toBeFalsy()
      expect(actualAuditLog).toHaveProperty("nextSanitiseCheck")
      expect(actualAuditLog.nextSanitiseCheck).toBe(now.toISOString())
      expect(actualAuditLog.errorRecordArchivalDate).toBe(expectedEvent.timestamp)
      expect(actualAuditLog.status).toBe(AuditLogStatus.processing)
    })

    it("should not change the status and should set nextSanitiseCheck if unsanitised", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.ErrorRecordArchival)

      const now = new Date()
      const message = new AuditLog("one", now, `dummy hash`)
      message.nextSanitiseCheck = now.toISOString()

      await gateway.create(message)

      message.events.push(expectedEvent)
      await gateway.update(message)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog).toHaveProperty("isSanitised")
      expect(actualAuditLog.isSanitised).toBe(0)
      expect(actualAuditLog).toHaveProperty("nextSanitiseCheck")
      expect(actualAuditLog.nextSanitiseCheck).toBe(now.toISOString())
      expect(actualAuditLog.status).toBe(AuditLogStatus.processing)
    })

    it("should not change the status and should set nextSanitiseCheck if sanitised", async () => {
      const expectedEvent = createAuditLogEvent("information", new Date(), EventType.SanitisedMessage)

      const now = new Date()
      const message = new AuditLog("one", now, `dummy hash`)
      message.nextSanitiseCheck = now.toISOString()

      await gateway.create(message)

      message.events.push(expectedEvent)
      await gateway.update(message)

      const actualMessage = await gateway.fetchOne(message.messageId)

      expect(actualMessage).toBeDefined()
      expect(actualMessage).toNotBeError()

      const actualAuditLog = actualMessage as AuditLog
      expect(actualAuditLog).not.toHaveProperty("errorRecordArchivalDate")
      expect(actualAuditLog).toHaveProperty("isSanitised")
      expect(actualAuditLog.isSanitised).toBe(1)
      expect(actualAuditLog.nextSanitiseCheck).toBeFalsy()
    })

    it("should return error when audit log does not exist", async () => {
      const result = await gateway.update(new AuditLog("External correlation id", new Date(), "dummy hash"))

      expect(isError(result)).toBe(true)
    })
  })
})
