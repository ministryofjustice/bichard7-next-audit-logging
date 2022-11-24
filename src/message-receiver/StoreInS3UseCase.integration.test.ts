import { TestS3Gateway } from "src/shared"
import { auditLogEventsS3Config } from "src/shared/testing"
import type { EventMessage } from "src/shared/types"
import { isError } from "src/shared/types"
import type { StoreInS3Result } from "./StoreInS3UseCase"
import StoreInS3UseCase from "./StoreInS3UseCase"

const gateway = new TestS3Gateway(auditLogEventsS3Config)

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
      messageFormat: "GeneralEvent",
      eventSourceArn: "DummyArn",
      eventSourceQueueName: "DummyQueueName"
    }

    const useCase = new StoreInS3UseCase(gateway)
    const result = await useCase.execute(message, message.messageFormat)

    expect(isError(result)).toBe(false)

    const { s3Path } = <StoreInS3Result>result
    expect(s3Path).toContain(message.messageFormat)

    const actualMessage = await gateway.getItem(s3Path)
    const actualJsonMessage = JSON.parse(actualMessage as string)
    expect(actualJsonMessage).toEqual(message)
  })
})
