jest.setTimeout(30000)

import "@bichard-testing/jest"
import type { EventMessage, S3Config } from "shared"
import TestS3Gateway from "shared/dist/S3Gateway/TestS3Gateway"
import { invokeFunction } from "@bichard-testing/lambda"
import type { StoreInS3Result } from "./index"

const config: S3Config = {
  url: "http://localhost:4566",
  region: "us-east-1",
  bucketName: "store-in-s3"
}

const gateway = new TestS3Gateway(config)

describe("Store in S3 end-to-end", () => {
  beforeAll(async () => {
    await gateway.createBucket(config.bucketName!, true)
  })

  beforeEach(async () => {
    await gateway.deleteAll()
  })

  test("given message is stored in S3", async () => {
    const message: EventMessage = {
      messageData: "DummyData",
      messageFormat: "AuditEvent",
      eventSourceArn: "DummyArn"
    }

    const result = await invokeFunction<EventMessage, StoreInS3Result>("store-in-s3", message)
    expect(result).toNotBeError()

    const { messageData, messageFormat, s3Path } = <StoreInS3Result>result
    expect(messageData).toBe(message.messageData)
    expect(messageFormat).toBe(message.messageFormat)

    const actualMessageData = await gateway.getItem(config.bucketName!, s3Path)
    expect(actualMessageData).toBe(message.messageData)
  })
})
