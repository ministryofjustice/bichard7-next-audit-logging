jest.setTimeout(10000)

import { invokeFunction } from "@bichard/testing"
import type { DynamoDbConfig } from "shared"
import { AuditLog, AuditLogEvent, AwsAuditLogDynamoGateway } from "shared"
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

  test("given event is stored in the API", async () => {
    const auditLog = new AuditLog("CorrelationId", new Date(), "XML")
    await gateway.create(auditLog)

    const event = new AuditLogEvent({
      category: "information",
      eventSource: "Record Event e2e test",
      eventType: "Test Event",
      timestamp: new Date()
    })

    const input: RecordEventInput = {
      messageId: auditLog.messageId,
      event,
      s3Path: "UNUSED"
    }

    const result = await invokeFunction("record-event", input)
    expect(result).toNotBeError()

    const actualAuditLog = <AuditLog>await gateway.fetchOne(auditLog.messageId)
    expect(actualAuditLog.events).toHaveLength(1)

    const actualEvent = actualAuditLog.events[0]
    expect(actualEvent.category).toBe(event.category)
    expect(actualEvent.eventSource).toBe(event.eventSource)
    expect(actualEvent.eventType).toBe(event.eventType)
    expect(actualEvent.timestamp).toBe(event.timestamp)
  })
})