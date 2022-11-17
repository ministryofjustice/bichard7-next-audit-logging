// - For each event:
//     X Transform it into new structure
//          X Remove eventSourceArn and s3Path
//          X Pull attributes from lookup table into event
//          X Add eventCode (lookup event type)
//          X Add indices (topExceptionsReport, automationReport)
//          X Add event XML from S3 if it's from a failure queue and it's not been sanitised
//     X Insert into events table
//
// X Remove events attribute
// X Remove automationReport, topExceptionsReport, lastEventType
// X Ensure isSanitised is set
// X Ensure nextSanitiseCheck is set to current datetime if not set and isSanitised is false
//
// Eventually, once everything is done:
// - Remove lookup table

import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { createS3Config, S3Gateway } from "src/shared"
import { mockDynamoAuditLog, setEnvironmentVariables } from "src/shared/testing"
import { AuditLogEvent } from "src/shared/types"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"
import migrateToNewStructure from "./MigrateToNewStructure"

setEnvironmentVariables()

const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const lookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogDynamoConfig, auditLogDynamoConfig.lookupTableName)
const lookupUseCase = new LookupEventValuesUseCase(lookupGateway)
const s3Gateway = new S3Gateway(createS3Config())

const superMockAuditLogEvent = () =>
  ({
    category: "information",
    timestamp: new Date(),
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

describe("migrateToNewStructure", () => {
  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, gateway.auditLogTableKey)
    await testGateway.deleteAll(auditLogDynamoConfig.lookupTableName, "id")
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
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
    gateway.insertOne(auditLogDynamoConfig.auditLogTableName, auditLog, gateway.auditLogTableKey)

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

  it("should correctly migrate large objects from the lookup table", async () => {})
  it("should move content from S3 into eventXml and output S3 paths", async () => {})
})
