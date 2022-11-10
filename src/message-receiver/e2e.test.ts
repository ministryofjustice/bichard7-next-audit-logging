import { createS3Config, encodeBase64, TestS3Gateway } from "src/shared"
import "src/shared/testing"
import { setEnvironmentVariables } from "src/shared/testing"
import type { AmazonMqEventSourceRecordEvent } from "src/shared/types"
setEnvironmentVariables()
process.env.MESSAGE_FORMAT = "AuditEvent"
process.env.EVENTS_BUCKET_NAME = "auditLogEventsBucket"

import messageReceiver from "."

const s3Config = createS3Config("EVENTS_BUCKET_NAME")
const s3Gateway = new TestS3Gateway(s3Config)

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

    const result = await messageReceiver(event)

    expect(result).toNotBeError()

    const s3Objects = await s3Gateway.getAll()
    const rawMessages = await Promise.all(s3Objects!.map((s3Object) => s3Gateway.getItem(s3Object.Key!)))
    const actualMessages = rawMessages
      .map((rawMessage) => JSON.parse(rawMessage as string))
      .sort((messageA, messageB) => (messageA.messageData > messageB.messageData ? 1 : -1))

    expect(actualMessages).toEqual(expectedMessages)
  })

  test("ProcessingValidation messages are decoded and stored unaltered", async () => {
    const originalMessageFormat = process.env.MESSAGE_FORMAT
    process.env.MESSAGE_FORMAT = "ProcessingValidation"

    const expectedMessages = [
      {
        incomingMessage: "dummy XML",
        annotatedHearingOutcome: "dummy AHO XML",
        triggers: [
          {
            code: "TRPR0002",
            identifier: "2"
          },
          {
            code: "TRPR0001",
            identifier: "1"
          }
        ]
      },
      {
        incomingMessage: "dummy XML 2",
        annotatedHearingOutcome: "dummy AHO XML 2",
        triggers: [
          {
            code: "TRPR0003",
            identifier: "1"
          },
          {
            code: "TRPR0004",
            identifier: "2"
          }
        ]
      }
    ]

    const event: AmazonMqEventSourceRecordEvent = {
      eventSource: "DummyEventSource",
      eventSourceArn: "DummyEventSourceARN",
      messages: [
        {
          messageID: "Message1",
          messageType: "Type1",
          data: encodeBase64(JSON.stringify(expectedMessages[0])),
          destination: {
            physicalName: "PROCESSING_VALIDATION"
          }
        },
        {
          messageID: "Message2",
          messageType: "Type2",
          data: encodeBase64(JSON.stringify(expectedMessages[1])),
          destination: {
            physicalName: "PROCESSING_VALIDATION"
          }
        }
      ]
    }

    const result = await messageReceiver(event)

    expect(result).toNotBeError()

    const s3Objects = await s3Gateway.getAll()
    const rawMessages = await Promise.all(s3Objects!.map((s3Object) => s3Gateway.getItem(s3Object.Key!)))
    const actualMessageFields = rawMessages.map((rawMessage) => JSON.parse(rawMessage as string).incomingMessage)

    expect(actualMessageFields).toContain(expectedMessages[0].incomingMessage)
    expect(actualMessageFields).toContain(expectedMessages[1].incomingMessage)

    process.env.MESSAGE_FORMAT = originalMessageFormat
  })
})
