jest.setTimeout(50000)

import fs from "fs"
import { AuditLogApiClient, encodeBase64, TestS3Gateway } from "src/shared"
import "src/shared/testing"
import { clearDynamoTable, createMockAuditLog, setEnvironmentVariables } from "src/shared/testing"
import type {
  AmazonMqEventSourceRecordEvent,
  ApiAuditLogEvent,
  DynamoAuditLogEvent,
  OutputApiAuditLog
} from "src/shared/types"
import { isError } from "src/shared/types"
import { v4 as uuid } from "uuid"
setEnvironmentVariables()

import EventHandlerSimulator from "./EventHandlerSimulator"

process.env.MESSAGE_FORMAT = "DUMMY"
process.env.EVENTS_BUCKET_NAME = "auditLogEventsBucket"

import messageReceiver from "src/message-receiver/index"
import { TestDynamoGateway } from "src/audit-log-api/test"
import createAdutiLogDynamoDbConfig from "src/audit-log-api/createAuditLogDynamoDbConfig"

const s3Gateway = new TestS3Gateway({
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: process.env.EVENTS_BUCKET_NAME,
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
})
const auditLogApi = new AuditLogApiClient("http://localhost:3010", "Api-key")
const eventHandlerSimulator = new EventHandlerSimulator()
const dynamoDbConfig = createAdutiLogDynamoDbConfig()
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)

const getEvents = async (messageId1: string, messageId2: string): Promise<ApiPollResult> => {
  const message1 = await auditLogApi.getMessage(messageId1)
  const message2 = await auditLogApi.getMessage(messageId2)
  if (isError(message1) || isError(message2)) {
    throw new Error("Unexpected error")
  }

  return {
    actualEvents1: message1.events,
    actualEvents2: message2.events
  }
}

interface TestInput {
  eventFilename: string
  messageFormat: string
}

type ApiPollResult = {
  actualEvents1: ApiAuditLogEvent[]
  actualEvents2: ApiAuditLogEvent[]
}

beforeEach(async () => {
  await clearDynamoTable(dynamoDbConfig.auditLogTableName, "messageId")
  await clearDynamoTable(dynamoDbConfig.eventsTableName, "_id")
  await s3Gateway.deleteAll()
})

test.each<TestInput>([
  { eventFilename: "general-event", messageFormat: "GeneralEvent" },
  { eventFilename: "court-result-input", messageFormat: "CourtResultInput" },
  { eventFilename: "data-set-pnc-update", messageFormat: "DataSetPncUpdate" },
  { eventFilename: "hearing-outcome-pnc-update", messageFormat: "HearingOutcomePncUpdate" },
  { eventFilename: "hearing-outcome-input", messageFormat: "HearingOutcomeInput" },
  { eventFilename: "pnc-update-request", messageFormat: "PncUpdateRequest" }
])(
  "given the event, the step function is invoked with 3 duplicate events across 2 messages",
  async ({ eventFilename, messageFormat }: TestInput) => {
    const auditLog1 = (await createMockAuditLog({
      externalCorrelationId: "CorrelationId1",
      messageHash: "hash-1"
    })) as OutputApiAuditLog
    const auditLog2 = (await createMockAuditLog({
      externalCorrelationId: "CorrelationId2",
      messageHash: "hash-2"
    })) as OutputApiAuditLog

    const rawMessage = fs.readFileSync(`events/${eventFilename}.xml`).toString()
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

    // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
    const s3Objects = (await s3Gateway.getAll()) ?? []
    const objectKeys = s3Objects.map((s3Object) => s3Object.Key)
    const executions = objectKeys.map((key) => eventHandlerSimulator.start(key!, uuid()))

    await Promise.all(executions)

    const { actualEvents1, actualEvents2 } = await getEvents(auditLog1.messageId, auditLog2.messageId)
    expect(actualEvents1).toHaveLength(2)
    expect(actualEvents2).toHaveLength(1)
  }
)

test("Event with only user should be stored in dynamodb", async () => {
  const rawMessage = fs.readFileSync(`events/report-run-event.xml`).toString()
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

  // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
  const s3Objects = (await s3Gateway.getAll()) ?? []
  const objectKey = s3Objects.map((s3Object) => s3Object.Key)[0]
  const eventHandlerResult = await eventHandlerSimulator.start(objectKey!, uuid()).catch((error) => error)

  expect(eventHandlerResult).toNotBeError()

  const eventsResult = await testDynamoGateway.getAll(dynamoDbConfig.eventsTableName)
  const events = eventsResult.Items as DynamoAuditLogEvent[]

  expect(events).toHaveLength(1)
  expect(events[0].user).toBe("supervisor")
})

test("Event with no MesageId and User should not fail to be processed by the audit logger", async () => {
  const rawMessage = fs.readFileSync(`events/no-messageid-and-user.xml`).toString()
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

  // Simulating EventBridge rule for triggering state machine for the uploaded object to S3 bucket
  const s3Objects = (await s3Gateway.getAll()) ?? []
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
