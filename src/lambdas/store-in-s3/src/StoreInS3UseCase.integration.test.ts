import type { EventMessage, S3Config } from "shared"
import { isError } from "shared"
import TestS3Gateway from "shared/dist/S3Gateway/TestS3Gateway"
import type { StoreInS3Result } from "./StoreInS3UseCase"
import StoreInS3UseCase from "./StoreInS3UseCase"

const config: S3Config = {
  url: "http://localhost:4566",
  region: "eu-west-1",
  bucketName: "store-in-s3"
}

const gateway = new TestS3Gateway(config)

describe("StoreInS3UseCase", () => {
  beforeAll(async () => {
    await gateway.createBucket(config.bucketName!, true)
  })

  beforeEach(async () => {
    await gateway.deleteAll()
  })

  it("receive message, store raw data in S3 and return S3 path", async () => {
    const message: EventMessage = {
      messageData: "DummyXML",
      messageFormat: "AuditEvent",
      messageType: "Information",
      eventSourceArn: "DummyArn"
    }

    const useCase = new StoreInS3UseCase(gateway)
    const result = await useCase.execute(message)

    expect(isError(result)).toBe(false)

    const { s3Path } = <StoreInS3Result>result
    expect(s3Path).toContain(message.messageFormat)

    const actualMessageData = await gateway.getItem(config.bucketName!, s3Path)
    expect(actualMessageData).toBe(message.messageData)
  })
})
