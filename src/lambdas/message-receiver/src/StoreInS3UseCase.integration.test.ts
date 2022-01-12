import type { EventMessage, S3Config } from "shared-types"
import { isError } from "shared-types"
import { TestAwsS3Gateway } from "shared"
import type { StoreInS3Result } from "./StoreInS3UseCase"
import StoreInS3UseCase from "./StoreInS3UseCase"

const config: S3Config = {
  url: 'http://localhost:4569',
  region: 'eu-west-2',
  bucketName: 'auditLogEventsBucket',
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER'
}

const gateway = new TestAwsS3Gateway(config)

describe("StoreInS3UseCase", () => {
  beforeAll(async () => {
    await gateway.createBucket(true)
  })

  beforeEach(async () => {
    await gateway.deleteAll()
  })

  it("receive message, store raw data in S3 and return S3 path", async () => {
    const message: EventMessage = {
      messageData: "DummyXML",
      messageFormat: "AuditEvent",
      eventSourceArn: "DummyArn",
      eventSourceQueueName: "DummyQueueName"
    }

    const useCase = new StoreInS3UseCase(gateway)
    const result = await useCase.execute(message)

    expect(isError(result)).toBe(false)

    const { s3Path } = <StoreInS3Result>result
    expect(s3Path).toContain(message.messageFormat)

    const actualMessage = await gateway.getItem(s3Path)
    const actualJsonMessage = JSON.parse(actualMessage as string)
    expect(actualJsonMessage).toEqual(message)
  })
})
