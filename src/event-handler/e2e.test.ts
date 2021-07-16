import fs from "fs"
import type { AmazonMqEventSourceRecordEvent, DynamoDbConfig } from "shared"
import { encodeBase64, AuditLog, AwsAuditLogDynamoGateway } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import { invokeFunction } from "@bichard/testing"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const gateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const testGateway = new TestDynamoGateway(config)

beforeAll(async () => {
  await testGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "messageId")
})

test.each<string>(["audit-event", "general-event"])(
  "given the event, the step function is invoked with 3 duplicate events across 2 messages",
  async (eventFilename: string) => {
    const auditLog1 = new AuditLog("CorrelationId1", new Date(), "XML")
    const auditLog2 = new AuditLog("CorrelationId2", new Date(), "XML")

    await gateway.create(auditLog1)
    await gateway.create(auditLog2)

    const rawMessage = fs.readFileSync(`../../events/${eventFilename}.xml`).toString()
    const messageData1 = encodeBase64(rawMessage.replace("EXTERNAL_CORRELATION_ID", auditLog1.messageId))
    const messageData2 = encodeBase64(rawMessage.replace("EXTERNAL_CORRELATION_ID", auditLog2.messageId))

    const event: AmazonMqEventSourceRecordEvent = {
      eventSource: eventFilename,
      eventSourceArn: eventFilename,
      messages: [
        {
          messageID: auditLog1.messageId,
          messageType: "messageType",
          data: messageData1
        },
        {
          messageID: auditLog1.messageId,
          messageType: "messageType",
          data: messageData1
        },
        {
          messageID: auditLog2.messageId,
          messageType: "messageType",
          data: messageData2
        }
      ]
    }

    const result = await invokeFunction(`${eventFilename}-receiver`, event)
    expect(result).toNotBeError()

    const actualAuditLogs = <AuditLog[]>await gateway.fetchMany()
    expect(actualAuditLogs).toHaveLength(2)

    const actualAuditLog1 = actualAuditLogs.find((x) => x.messageId === auditLog1.messageId)!
    expect(actualAuditLog1.events).toHaveLength(2)

    const actualAuditLog2 = actualAuditLogs.find((x) => x.messageId === auditLog2.messageId)!
    expect(actualAuditLog2.events).toHaveLength(1)
  }
)
