jest.setTimeout(30000)

import "shared-testing"
import type { EventMessage, S3PutObjectEvent } from "shared-types"
import { invokeFunction } from "shared-testing"
import type { S3Config } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import type { RetrieveEventFromS3Result } from "src"

const bucketName = "audit-log-events"
const config: S3Config = {
  url: "http://localhost:4566",
  region: "us-east-1",
  bucketName
}

const gateway = new TestAwsS3Gateway(config)

describe("Retrieve event from S3 end-to-end", () => {
  beforeAll(async () => {
    await gateway.createBucket(true)
  })

  beforeEach(async () => {
    await gateway.deleteAll()
  })

  test("given an event is stored in S3", async () => {
    const s3ObjectKey = "dummy-event.json"
    const S3ObjectContent = JSON.stringify(<EventMessage>{
      messageData: "DummyData",
      messageFormat: "AuditEvent",
      eventSourceArn: "DummyArn",
      eventSourceQueueName: "DummyQueueName"
    })
    await gateway.upload(s3ObjectKey, S3ObjectContent)

    const payload = {
      id: "step-execution-unique-id",
      detail: {
        requestParameters: {
          key: s3ObjectKey,
          bucketName
        }
      }
    }

    const result = await invokeFunction<S3PutObjectEvent, RetrieveEventFromS3Result>("retrieve-event-from-s3", payload)
    expect(result).toNotBeError()

    const { messageData, messageFormat, s3Path } = <RetrieveEventFromS3Result>result
    expect(messageData).toBe(messageData)
    expect(messageFormat).toBe(messageFormat)
    expect(s3Path).toBe(s3ObjectKey)
  })
})
