import { FakeS3Gateway, mockDynamoAuditLog } from "src/shared/testing"
import { isError } from "src/shared/types"
import DeleteMessageObjectsFromS3UseCase from "./DeleteMessageObjectsFromS3UseCase"

const fakeMessagesS3Gateway = new FakeS3Gateway()
const useCase = new DeleteMessageObjectsFromS3UseCase(fakeMessagesS3Gateway)

beforeEach(() => {
  fakeMessagesS3Gateway.reset()
})

it("should delete message xml from S3 when item exists in S3", async () => {
  const dummyXml = "Xml"
  const s3Path = "Dummy Path 1"

  fakeMessagesS3Gateway.reset({
    [s3Path]: dummyXml,
    ShouldNotDeleteMessage: dummyXml
  })

  const auditLog = mockDynamoAuditLog({ s3Path })
  const result = await useCase.call(auditLog)

  expect(result).toNotBeError()
  expect(Object.keys(fakeMessagesS3Gateway.items)).toHaveLength(1)
  expect(fakeMessagesS3Gateway.items.ShouldNotDeleteMessage).toBeDefined()
})

it("should return error when an S3 gateway (Messages) returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeMessagesS3Gateway.shouldReturnError(expectedError)
  const auditLog = mockDynamoAuditLog({ s3Path: "dummy" })
  const result = await useCase.call(auditLog)

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
