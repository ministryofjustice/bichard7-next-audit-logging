jest.setTimeout(30000)

import "shared-testing"
import { invokeFunction } from "shared-testing"
import type { DynamoDbConfig } from "shared"
import { AuditLog, BichardAuditLogEvent, AwsAuditLogDynamoGateway } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import type { RecordEventInput } from "./index"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const testGateway = new TestDynamoGateway(config)
const gateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)

describe("Record Event end-to-end", () => {
  beforeEach(async () => {
    await testGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  test("given message is stored in the API", async () => {
    const auditLog = new AuditLog("CorrelationId", new Date(), "XML")
    await gateway.create(auditLog)

    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "Record Event e2e test",
      eventType: "Test Event",
      timestamp: new Date(),
      eventSourceArn: "DummyArn",
      s3Path: "DummyPath",
      eventSourceQueueName: "DummyQueue"
    })

    const input: RecordEventInput = {
      messageId: auditLog.messageId,
      event
    }

    const result = await invokeFunction("record-event", input)
    expect(result).toNotBeError()

    const actualAuditLog = <AuditLog>await gateway.fetchOne(auditLog.messageId)
    expect(actualAuditLog.events).toHaveLength(1)

    const actualEvent = <BichardAuditLogEvent>actualAuditLog.events[0]
    expect(actualEvent.category).toBe(event.category)
    expect(actualEvent.eventSource).toBe(event.eventSource)
    expect(actualEvent.eventType).toBe(event.eventType)
    expect(actualEvent.timestamp).toBe(event.timestamp)
    expect(actualEvent.eventSourceArn).toBe(event.eventSourceArn)
    expect(actualEvent.s3Path).toBe(event.s3Path)
  })

  test("given message is not stored in the API", async () => {
    const expectedMessageId = "DummyMessageID1"
    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "Record Event e2e test",
      eventType: "Test Event",
      timestamp: new Date(),
      eventSourceArn: "DummyArn",
      s3Path: "DummyPath",
      eventSourceQueueName: "DummyQueue"
    })

    const input: RecordEventInput = {
      messageId: expectedMessageId,
      event
    }

    const result = await invokeFunction("record-event", input)
    expect(result).toNotBeError()

    const actualAuditLog = <AuditLog>await gateway.fetchOne(expectedMessageId)
    expect(actualAuditLog).toBeDefined()

    const { messageId, caseId, externalCorrelationId, messageXml, receivedDate, createdBy, events } = actualAuditLog
    expect(messageId).toBe(expectedMessageId)
    expect(externalCorrelationId).toBe(expectedMessageId)
    expect(receivedDate).toBe("1970-01-01T00:00:00.000Z")
    expect(messageXml).toBe("Unknown")
    expect(caseId).toBe("Unknown")
    expect(createdBy).toBe("Event handler")
    expect(events).toHaveLength(1)

    const actualEvent = <BichardAuditLogEvent>events[0]
    expect(actualEvent.category).toBe(event.category)
    expect(actualEvent.eventSource).toBe(event.eventSource)
    expect(actualEvent.eventType).toBe(event.eventType)
    expect(actualEvent.timestamp).toBe(event.timestamp)
    expect(actualEvent.eventSourceArn).toBe(event.eventSourceArn)
    expect(actualEvent.s3Path).toBe(event.s3Path)
  })

  test("given message is not stored in the API if no message Id is provided", async () => {
    const event = new BichardAuditLogEvent({
      category: "information",
      eventSource: "Record Event e2e test",
      eventType: "Test Event",
      timestamp: new Date(),
      eventSourceArn: "DummyArn",
      s3Path: "DummyPath",
      eventSourceQueueName: "DummyQueue"
    })

    const input: RecordEventInput = {
      messageId: "",
      event
    }

    const result = await invokeFunction("record-event", input)
    expect(result).toNotBeError()

    const actualAuditLog = <AuditLog>await gateway.fetchOne("")
    expect(actualAuditLog).toBeDefined()

    const { messageId, externalCorrelationId, events } = actualAuditLog
    expect(messageId).toBeUndefined()
    expect(externalCorrelationId).toBeUndefined()
    expect(events).toBeUndefined()
  })
})
