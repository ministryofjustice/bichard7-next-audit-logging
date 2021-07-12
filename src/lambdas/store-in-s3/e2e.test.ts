const bucketName = "store-in-s3-e2e-test"

process.env.AWS_URL = "http://localhost:4566"
process.env.AWS_REGION = "eu-west-1"
process.env.EVENTS_BUCKET_NAME = bucketName

import type { EventMessage } from "shared"
import TestS3Gateway from "shared/dist/S3Gateway/TestS3Gateway"
import createS3Config from "createS3Config"
import handler from "./index"

const gateway = new TestS3Gateway(createS3Config())

describe("Store in S3 end-to-end", () => {
  beforeAll(async () => {
    await gateway.createBucket(bucketName, true)
  })

  beforeEach(async () => {
    await gateway.deleteAll()
  })
})

test("given message is stored in S3", async () => {
  const message: EventMessage = {
    messageData: "DummyData",
    messageFormat: "AuditEvent"
  }

  // TODO: Invoke lambda function instead of calling directly.
  const result = await handler(message)

  expect(result.messageData).toBe(message.messageData)
  expect(result.messageFormat).toBe(message.messageFormat)

  const actualMessageData = await gateway.getItem(bucketName, result.s3Path)
  expect(actualMessageData).toBe(message.messageData)
})
