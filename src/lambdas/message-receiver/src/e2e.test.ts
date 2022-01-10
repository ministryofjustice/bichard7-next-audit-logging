jest.setTimeout(30000)

import "shared-testing"
import { invokeFunction } from "shared-testing"
import type { AmazonMqEventSourceRecordEvent } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import createS3Config from "./createS3Config"

process.env.S3_URL = "http://localhost:4566"
process.env.S3_REGION = "us-east-1"
process.env.EVENTS_BUCKET_NAME = "audit-log-events"
const s3Config = createS3Config()
const s3Gateway = new TestAwsS3Gateway(s3Config)

describe("Message receiver e2e test", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
  })

  test("given a message, the Step Function is invoked", async () => {
    const expectedMessages = [
      {
        messageData: "DummyData1",
        messageFormat: "AuditEvent",
        eventSourceArn: "DummyEventSourceARN",
        eventSourceQueueName: "DUMMY_QUEUE_1"
      },
      {
        messageData: "DummyData2",
        messageFormat: "AuditEvent",
        eventSourceArn: "DummyEventSourceARN",
        eventSourceQueueName: "DUMMY_QUEUE_2"
      }
    ]

    const event: AmazonMqEventSourceRecordEvent = {
      eventSource: "DummyEventSource",
      eventSourceArn: "DummyEventSourceARN",
      messages: [
        {
          messageID: "Message1",
          messageType: "Type1",
          data: "DummyData1",
          destination: {
            physicalName: "DUMMY_QUEUE_1.FAILURE"
          }
        },
        {
          messageID: "Message2",
          messageType: "Type2",
          data: "DummyData2",
          destination: {
            physicalName: "DUMMY_QUEUE_2"
          }
        }
      ]
    }

    const result = await invokeFunction("message-receiver", event)

    expect(result).toNotBeError()

    const s3Objects = await s3Gateway.getAll()
    const rawMessages = await Promise.all(s3Objects!.map((s3Object) => s3Gateway.getItem(s3Object.Key!)))
    const actualMessages = rawMessages
      .map((rawMessage) => JSON.parse(rawMessage as string))
      .sort((messageA, messageB) => (messageA.messageData > messageB.messageData ? 1 : -1))

    expect(actualMessages).toEqual(expectedMessages)
  })
})
