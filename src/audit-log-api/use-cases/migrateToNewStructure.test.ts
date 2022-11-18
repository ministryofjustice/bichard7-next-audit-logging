jest.setTimeout(99999999)
import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import fs from "fs"
import { compress, createS3Config, encodeBase64, TestS3Gateway } from "src/shared"
import { mockDynamoAuditLog, setEnvironmentVariables } from "src/shared/testing"
import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { AuditLogLookup, AuditLogStatus } from "src/shared/types"
import type { AuditLogEventCompressedValue } from "src/shared/types/AuditLogEvent"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"
import migrateToNewStructure from "./MigrateToNewStructure"

setEnvironmentVariables()
process.env.EVENTS_BUCKET_NAME = "auditLogEventsBucket"

const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const lookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogDynamoConfig, auditLogDynamoConfig.lookupTableName)
const lookupUseCase = new LookupEventValuesUseCase(lookupGateway)
const s3Gateway = new TestS3Gateway(createS3Config("EVENTS_BUCKET_NAME"))

const superMockAuditLogEvent = () =>
  ({
    category: "information",
    timestamp: new Date().toISOString(),
    eventType: "Trigger generated",
    eventSource: "TestSource",
    eventSourceArn: "TestArn",
    eventSourceQueueName: "Test event source queue name",
    s3Path: "test path",
    attributes: {
      "Attribute 1": "Attribute 1 data".repeat(500),
      "Attribute 2": "Attribute 2 data"
    }
  } as any as AuditLogEvent)

describe("migrateToNewStructure()", () => {
  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, gateway.auditLogTableKey)
    await testGateway.deleteAll(auditLogDynamoConfig.lookupTableName, "id")
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
    await fs.promises.unlink("s3-paths-to-delete.txt").catch((e) => e)
  })

  it("should correctly migrate events into the new table", async () => {
    const auditLog = {
      ...mockDynamoAuditLog(),
      automationReport: { events: [], forceOwner: "010000" },
      topExceptionsReport: { events: [] },
      lastEventType: "Triggers generated"
    }

    delete (auditLog as any).isSanitised
    delete (auditLog as any).nextSanitiseCheck

    auditLog.events = [superMockAuditLogEvent()]
    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    expect(auditLog).toHaveProperty("events")
    expect(auditLog).toHaveProperty("automationReport")
    expect(auditLog).toHaveProperty("topExceptionsReport")
    expect(auditLog).toHaveProperty("lastEventType")
    expect(auditLog).toHaveProperty("version", 0)
    expect(auditLog).not.toHaveProperty("isSanitised")
    expect(auditLog).not.toHaveProperty("nextSanitiseCheck")
    expect(auditLog.events[0]).toHaveProperty("eventSourceArn")
    expect(auditLog.events[0]).toHaveProperty("s3Path")
    expect(auditLog.events[0]).not.toHaveProperty("_automationReport")
    expect(auditLog.events[0]).not.toHaveProperty("_topExceptionsReport")

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog)

    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item

    expect(newAuditLog).not.toHaveProperty("events")
    expect(newAuditLog).not.toHaveProperty("automationReport")
    expect(newAuditLog).not.toHaveProperty("topExceptionsReport")
    expect(newAuditLog).not.toHaveProperty("lastEventType")
    expect(newAuditLog).toHaveProperty("isSanitised")
    expect(newAuditLog).toHaveProperty("nextSanitiseCheck")
    expect(newAuditLog).toHaveProperty("version", 1)

    const newEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items as AuditLogEvent[]
    expect(newEvents).toHaveLength(1)
    expect(newEvents[0].eventCode).toBe("triggers.generated")
    expect(newEvents[0]).not.toHaveProperty("eventSourceArn")
    expect(newEvents[0]).not.toHaveProperty("s3Path")
    expect(newEvents[0]).toHaveProperty("_automationReport")
    expect(newEvents[0]).toHaveProperty("_topExceptionsReport")
    expect(newEvents[0].attributes["Attribute 1"]).toHaveProperty("_compressedValue")
  })

  it("should correctly migrate large objects from the lookup table", async () => {
    const auditLog = mockDynamoAuditLog()

    const lookupItem1 = new AuditLogLookup("Test value 1", auditLog.messageId)

    const lookupItem2Value = (await compress("Test value 2".repeat(500))) as string
    const lookupItem2 = new AuditLogLookup(lookupItem2Value, auditLog.messageId)
    lookupItem2.isCompressed = true

    const event = superMockAuditLogEvent()
    event.attributes["Attribute 3"] = { valueLookup: lookupItem1.id }
    event.attributes["Attribute 4"] = { valueLookup: lookupItem2.id }

    const eventXmlValue = (await compress("Event XML value".repeat(500))) as string
    const eventXmlLookup = new AuditLogLookup(eventXmlValue, auditLog.messageId)
    eventXmlLookup.isCompressed = true

    event.eventXml = { valueLookup: eventXmlLookup.id } as any
    auditLog.events = [event]

    await testGateway.insertOne(auditLogDynamoConfig.lookupTableName, lookupItem1, "id")
    await testGateway.insertOne(auditLogDynamoConfig.lookupTableName, lookupItem2, "id")
    await testGateway.insertOne(auditLogDynamoConfig.lookupTableName, eventXmlLookup, "id")
    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog)

    const newEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items as AuditLogEvent[]

    expect(newEvents).toHaveLength(1)
    expect(newEvents[0]).toHaveProperty("eventXml")
    expect(newEvents[0].eventXml).toHaveProperty("_compressedValue", eventXmlValue)
    expect(newEvents[0]).toHaveProperty("attributes")
    expect(newEvents[0].attributes).toHaveProperty("Attribute 3", "Test value 1")
    expect(newEvents[0].attributes).toHaveProperty("Attribute 4")
    expect(newEvents[0].attributes["Attribute 4"]).toHaveProperty("_compressedValue", lookupItem2Value)
  })

  it("should move content from S3 into eventXml and output S3 paths", async () => {
    const auditLog = {
      ...mockDynamoAuditLog(),
      automationReport: { events: [], forceOwner: "010000" },
      topExceptionsReport: { events: [] },
      lastEventType: "Triggers generated"
    }

    auditLog.events = [
      {
        ...superMockAuditLogEvent(),
        s3Path: "path/to/test.xml",
        eventSourceQueueName: "queueName",
        category: "error",
        timestamp: "2022-01-01"
      },
      {
        ...superMockAuditLogEvent(),
        s3Path: "path/to/test-long.xml",
        eventSourceQueueName: "queueName",
        category: "error",
        timestamp: "2022-02-02"
      }
    ] as AuditLogEvent[]

    const content = JSON.stringify({ messageData: encodeBase64("xml content") })
    s3Gateway.upload(auditLog.events[0].s3Path!, content)
    const longContent = JSON.stringify({ messageData: encodeBase64("really long xml".repeat(500)) })
    s3Gateway.upload(auditLog.events[1].s3Path!, longContent)

    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    expect(auditLog).toHaveProperty("events")
    expect(auditLog.events[0]).toHaveProperty("s3Path")
    expect(auditLog.events[0]).not.toHaveProperty("eventXml")
    expect(auditLog.events[1]).toHaveProperty("s3Path")
    expect(auditLog.events[1]).not.toHaveProperty("eventXml")

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog)

    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item

    expect(newAuditLog).not.toHaveProperty("events")

    const newEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items?.sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    ) as AuditLogEvent[]

    expect(newEvents).toHaveLength(2)
    expect(newEvents[0]).not.toHaveProperty("s3Path")
    expect(newEvents[0]).toHaveProperty("eventXml", "xml content")
    expect(newEvents[1]).not.toHaveProperty("s3Path")
    expect(newEvents[1].eventXml).toHaveProperty("_compressedValue")
    const compressedValue = (newEvents[1].eventXml as AuditLogEventCompressedValue)._compressedValue
    expect(compressedValue).not.toBe("really long xml".repeat(500))

    const pathsToDelete = (await fs.promises.readFile("s3-paths-to-delete.txt"))
      .toString()
      .split("\n")
      .filter((x) => x)

    expect(pathsToDelete).toHaveLength(2)
    expect(pathsToDelete).toContain("path/to/test.xml")
    expect(pathsToDelete).toContain("path/to/test-long.xml")
  })

  it("should update the status fields", async () => {
    const auditLog: Partial<DynamoAuditLog> = mockDynamoAuditLog()
    delete auditLog.pncStatus
    delete auditLog.triggerStatus

    auditLog.events = [superMockAuditLogEvent()]

    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    expect(auditLog).not.toHaveProperty("pncStatus")
    expect(auditLog).not.toHaveProperty("triggerStatus")

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog as DynamoAuditLog)

    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item

    expect(newAuditLog).not.toHaveProperty("events")

    expect(newAuditLog).toHaveProperty("pncStatus", "Processing")
    expect(newAuditLog).toHaveProperty("triggerStatus", "NoTriggers")
  })

  it("should update the status fields if the record has already been migrated", async () => {
    const auditLog: Partial<DynamoAuditLog> = mockDynamoAuditLog()
    delete auditLog.pncStatus
    delete auditLog.triggerStatus
    delete auditLog.events

    const event = superMockAuditLogEvent()

    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)
    await gateway.insertOne(auditLogDynamoConfig.eventsTableName, event, "_id")

    expect(auditLog).not.toHaveProperty("pncStatus")
    expect(auditLog).not.toHaveProperty("triggerStatus")

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog as DynamoAuditLog)

    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item

    expect(newAuditLog).not.toHaveProperty("events")

    expect(newAuditLog).toHaveProperty("pncStatus", "Processing")
    expect(newAuditLog).toHaveProperty("triggerStatus", "NoTriggers")
  })

  it("should handle records with more than 24 events", async () => {
    const auditLog: Partial<DynamoAuditLog> = mockDynamoAuditLog()

    for (let i = 0; i < 100; i++) {
      auditLog.events?.push({
        ...superMockAuditLogEvent(),
        attributes: {},
        eventType: `Event type ${i}`
      } as AuditLogEvent)
    }
    const expectedEventTypes = auditLog.events?.map((e) => e.eventType).sort()

    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    expect(auditLog.events).toHaveLength(100)

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog as DynamoAuditLog)

    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item

    expect(newAuditLog).not.toHaveProperty("events")

    const newEvents = (await testGateway.getAll(auditLogDynamoConfig.eventsTableName)).Items?.sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    ) as AuditLogEvent[]

    expect(newEvents).toHaveLength(100)

    const receivedEventTypes = newEvents.map((e) => e.eventType).sort()
    expect(receivedEventTypes).toStrictEqual(expectedEventTypes)
  })

  it.only("should handle current audit logs", async () => {
    const auditLog: DynamoAuditLog = {
      messageId: "34aaa682-d397-4f80-9574-887a740a80bc",
      automationReport: { events: [] },
      caseId: "43TT0268122",
      createdBy: "Incoming message handler",
      events: [],
      externalCorrelationId: "221118-080458-C8EH-YG33-U4NR",
      externalId: "38997592",
      forceOwner: 43,
      isSanitised: 0,
      lastEventType: "",
      messageHash: "2e12d805201344a1f1dd53b8a08208bb5008cb614a66b4a73919290de9b6cd8e",
      nextSanitiseCheck: "2022-11-18T08:04:00.000Z",
      pncStatus: "Ignored",
      receivedDate: "2022-11-18T08:04:00.000Z",
      retryCount: 0,
      s3Path: "2022/11/18/08/04/38997592.xml",
      status: AuditLogStatus.completed,
      stepExecutionId: "0699fc47-42d3-86be-f708-c573b2cec73d",
      systemId: "B00LIBRA",
      topExceptionsReport: { events: [] },
      triggerStatus: "NoTriggers",
      version: 9
    }
    await gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

    await migrateToNewStructure(gateway, lookupUseCase, s3Gateway, auditLog as DynamoAuditLog)
    const newAuditLog = (
      (await gateway.getOne(
        auditLogDynamoConfig.auditLogTableName,
        gateway.auditLogTableKey,
        auditLog.messageId
      )) as DocumentClient.GetItemOutput
    ).Item
    expect(newAuditLog).not.toHaveProperty("topExceptionsReport")
    expect(newAuditLog).not.toHaveProperty("automationReport")
    expect(newAuditLog).not.toHaveProperty("events")
  })
})
