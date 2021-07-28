jest.setTimeout(50000)

import "@bichard/testing-jest"
import fs from "fs"
import type { AmazonMqEventSourceRecordEvent, DynamoDbConfig, AuditLogEvent } from "shared"
import { encodeBase64, AuditLog, AwsAuditLogDynamoGateway, Poller, PollOptions } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import { invokeFunction } from "@bichard/testing-lambda"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const gateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const testGateway = new TestDynamoGateway(config)

type PollResult = {
  actualEvents1: AuditLogEvent[]
  actualEvents2: AuditLogEvent[]
}

const getEvents = async (messageId1: string, messageId2: string): Promise<PollResult> => {
  const actualEvents1 = <AuditLogEvent[]>await gateway.fetchEvents(messageId1)
  const actualEvents2 = <AuditLogEvent[]>await gateway.fetchEvents(messageId2)

  return {
    actualEvents1,
    actualEvents2
  }
}

beforeEach(async () => {
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
          data: messageData1,
          destination: {
            physicalName: ""
          }
        },
        {
          messageID: auditLog1.messageId,
          messageType: "messageType",
          data: messageData1,
          destination: {
            physicalName: ""
          }
        },
        {
          messageID: auditLog2.messageId,
          messageType: "messageType",
          data: messageData2,
          destination: {
            physicalName: ""
          }
        }
      ]
    }

    const result = await invokeFunction(`${eventFilename}-receiver`, event)
    expect(result).toNotBeError()

    const poller = new Poller(() => getEvents(auditLog1.messageId, auditLog2.messageId))

    const options = new PollOptions<PollResult>(40000)
    options.delay = 300
    options.condition = ({ actualEvents1, actualEvents2 }) => actualEvents1.length === 2 && actualEvents2.length === 1

    try {
      await poller.poll(options)
    } catch (error) {
      console.error(`Event Handler e2e (${eventFilename}) failed when polling for events`)

      const events = await getEvents(auditLog1.messageId, auditLog2.messageId)
      console.log(events)

      throw error
    }
  }
)
