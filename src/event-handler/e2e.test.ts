jest.setTimeout(250000)

import "shared-testing"
import fs from "fs"
import type { AmazonMqEventSourceRecordEvent, DynamoDbConfig, AuditLogEvent } from "shared"
import { encodeBase64, AuditLog, AwsAuditLogDynamoGateway, Poller, PollOptions } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import { invokeFunction } from "shared-testing"
import type { S3Config } from "@bichard/s3"
import { TestAwsS3Gateway } from "@bichard/s3"
import type { S3 } from "aws-sdk"
import EventHandlerSimulator from "./EventHandlerSimulator"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const gateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const testGateway = new TestDynamoGateway(config)
const s3Config: S3Config = {
  url: "http://localhost:4566",
  region: "us-east-1",
  bucketName: "audit-log-events"
}
const s3Gateway = new TestAwsS3Gateway(s3Config)
const eventHandlerSimulator = new EventHandlerSimulator("http://localhost:4566")

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
  await s3Gateway.deleteAll()
})

const wait = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))

test.each<string>([
  "audit-event",
  "general-event",
  "court-result-input",
  "data-set-pnc-update",
  "hearing-outcome-pnc-update",
  "hearing-outcome-input",
  "pnc-update-request"
])(
  "given the event, the step function is invoked with 3 duplicate events across 2 messages",
  async (eventFilename: string) => {
    const auditLog1 = new AuditLog("CorrelationId1", new Date(), "XML")
    const auditLog2 = new AuditLog("CorrelationId2", new Date(), "XML")

    await gateway.create(auditLog1)
    await gateway.create(auditLog2)

    const rawMessage = fs.readFileSync(`../../events/${eventFilename}.xml`).toString()
    const messageData1 = encodeBase64(rawMessage.replace("{MESSAGE_ID}", auditLog1.messageId))
    const messageData2 = encodeBase64(rawMessage.replace("{MESSAGE_ID}", auditLog2.messageId))

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

    // Waiting until events are uploaded to S3 bucket
    const s3Poller = new Poller(() => s3Gateway.getAll())

    const s3PollerOptions = new PollOptions<S3.ObjectList | undefined>(40000)
    s3PollerOptions.delay = 1000
    s3PollerOptions.condition = (s3Objects) => (s3Objects?.length || 0) === event.messages.length

    const s3PollerResult = await s3Poller.poll(s3PollerOptions).catch((error) => error)

    expect(s3Poller).toNotBeError()

    // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
    const s3Objects = s3PollerResult as S3.ObjectList
    const objectKeys = s3Objects.map((s3Object) => s3Object.Key)
    const executions: Promise<void>[] = []
    objectKeys.forEach((key, index) => {
      const promise = async () => {
        await wait(index * 5)
        await eventHandlerSimulator.start(key!)
      }
      executions.push(promise())
    })

    await Promise.all(executions)

    await wait(5)

    const dynamoDbPoller = new Poller(() => getEvents(auditLog1.messageId, auditLog2.messageId))

    const dynamoDbPollerOptions = new PollOptions<PollResult>(100000)
    dynamoDbPollerOptions.delay = 1000
    dynamoDbPollerOptions.condition = ({ actualEvents1, actualEvents2 }) =>
      actualEvents1.length === 2 && actualEvents2.length === 1

    try {
      await dynamoDbPoller.poll(dynamoDbPollerOptions)
    } catch (error) {
      console.error(`Event Handler e2e (${eventFilename}) failed when polling for events`)

      const events = await getEvents(auditLog1.messageId, auditLog2.messageId)
      console.log(events)

      throw error
    }
  }
)

test("Event with no MesageId should not fail to be processed by the audit logger", async () => {
  const rawMessage = fs.readFileSync(`../../events/report-run-event.xml`).toString()

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "general-event",
    eventSourceArn: "general-event",
    messages: [
      {
        messageID: "",
        messageType: "messageType",
        data: rawMessage,
        destination: {
          physicalName: ""
        }
      }
    ]
  }

  const result = await invokeFunction(`general-event-receiver`, event)
  expect(result).toNotBeError()
})
