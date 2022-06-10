jest.setTimeout(50000)

import "shared-testing"
import fs from "fs"
import { setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import type { AmazonMqEventSourceRecordEvent, AuditLogEvent, DynamoDbConfig } from "shared-types"
import { AuditLog } from "shared-types"
import { AwsAuditLogDynamoGateway, encodeBase64, Poller, PollOptions, TestDynamoGateway, TestS3Gateway } from "shared"
import type { S3 } from "aws-sdk"
import EventHandlerSimulator from "./EventHandlerSimulator"
import { v4 as uuid } from "uuid"

process.env.MESSAGE_FORMAT = "DUMMY"
process.env.EVENTS_BUCKET_NAME = "auditLogEventsBucket"
// eslint-disable-next-line import/extensions
const { default: messageReceiver } = require("../../../message-receiver/build/messageReceiver")

const s3Gateway = new TestS3Gateway({
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: process.env.EVENTS_BUCKET_NAME,
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
})

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "S3RVER",
  AWS_SECRET_ACCESS_KEY: "S3RVER"
}
const auditLogTableName = "auditLogTable"
const auditLogLookupTableName = "auditLogLookupTable"
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(dynamoConfig, dynamoConfig.TABLE_NAME)
const testDynamoGateway = new TestDynamoGateway(dynamoConfig)
const eventHandlerSimulator = new EventHandlerSimulator()

const getEvents = async (messageId1: string, messageId2: string): Promise<DynamoPollResult> => {
  const actualEvents1 = <AuditLogEvent[]>await auditLogDynamoGateway.fetchEvents(messageId1)
  const actualEvents2 = <AuditLogEvent[]>await auditLogDynamoGateway.fetchEvents(messageId2)

  return {
    actualEvents1,
    actualEvents2
  }
}

const wait = (seconds: number) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))

interface TestInput {
  eventFilename: string
  messageFormat: string
}

type DynamoPollResult = {
  actualEvents1: AuditLogEvent[]
  actualEvents2: AuditLogEvent[]
}

beforeEach(async () => {
  await testDynamoGateway.deleteAll(auditLogTableName, "messageId")
  await testDynamoGateway.deleteAll(auditLogLookupTableName, "id")
  await s3Gateway.deleteAll()
})

test.each<TestInput>([
  { eventFilename: "audit-event", messageFormat: "AuditEvent" },
  { eventFilename: "general-event", messageFormat: "GeneralEvent" },
  { eventFilename: "court-result-input", messageFormat: "CourtResultInput" },
  { eventFilename: "data-set-pnc-update", messageFormat: "DataSetPncUpdate" },
  { eventFilename: "hearing-outcome-pnc-update", messageFormat: "HearingOutcomePncUpdate" },
  { eventFilename: "hearing-outcome-input", messageFormat: "HearingOutcomeInput" },
  { eventFilename: "pnc-update-request", messageFormat: "PncUpdateRequest" }
])(
  "given the event, the step function is invoked with 3 duplicate events across 2 messages",
  async ({ eventFilename, messageFormat }: TestInput) => {
    const auditLog1 = new AuditLog("CorrelationId1", new Date(), "hash-1")
    const auditLog2 = new AuditLog("CorrelationId2", new Date(), "hash-2")

    await auditLogDynamoGateway.create(auditLog1)
    await auditLogDynamoGateway.create(auditLog2)

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

    process.env.MESSAGE_FORMAT = messageFormat
    const result = await messageReceiver(event)
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
        await wait(index * 3)
        await eventHandlerSimulator.start(key!, uuid())
      }
      executions.push(promise())
    })

    await Promise.all(executions)

    await wait(5)

    const dynamoDbPoller = new Poller(() => getEvents(auditLog1.messageId, auditLog2.messageId))

    const dynamoDbPollerOptions = new PollOptions<DynamoPollResult>(100000)
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
  const messageData = encodeBase64(rawMessage.replace("{MESSAGE_ID}", uuid()))

  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "general-event",
    eventSourceArn: "general-event",
    messages: [
      {
        messageID: "",
        messageType: "messageType",
        data: messageData,
        destination: {
          physicalName: ""
        }
      }
    ]
  }

  process.env.MESSAGE_FORMAT = "GeneralEvent"
  const messageReceiverResult = await messageReceiver(event)
  expect(messageReceiverResult).toNotBeError()

  // Waiting until events are uploaded to S3 bucket
  const s3Poller = new Poller(() => s3Gateway.getAll())

  const s3PollerOptions = new PollOptions<S3.ObjectList | undefined>(40000)
  s3PollerOptions.delay = 1000
  s3PollerOptions.condition = (s3Objects) => (s3Objects?.length || 0) === 1

  const s3PollerResult = await s3Poller.poll(s3PollerOptions).catch((error) => error)

  expect(s3Poller).toNotBeError()

  // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
  const s3Objects = s3PollerResult as S3.ObjectList
  const objectKey = s3Objects.map((s3Object) => s3Object.Key)[0]
  const eventHandlerResult = await eventHandlerSimulator.start(objectKey!, uuid()).catch((error) => error)

  expect(eventHandlerResult).toNotBeError()
})

test("Event should fail the validation when S3 object does not exist", async () => {
  // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
  const objectKey = "dummy-non-existent-s3-key"
  const eventHandlerResult = await eventHandlerSimulator.start(objectKey!, uuid()).catch((error) => error)

  expect(eventHandlerResult).toNotBeError()
  expect(eventHandlerSimulator.getStoreEventOutput()).toStrictEqual({ validationResult: { s3ObjectNotFound: true } })
})
