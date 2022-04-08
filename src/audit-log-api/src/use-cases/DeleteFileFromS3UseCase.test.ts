import { FakeS3Gateway } from "shared-testing"
import { isError } from "shared-types"
import DeleteFileFromS3UseCase from "./DeleteFileFromS3UseCase"

const fakeS3Gateway = new FakeS3Gateway()
const deleteFileFromS3UseCase = new DeleteFileFromS3UseCase(fakeS3Gateway)

it("should delete message xml from S3 when item exists in S3", async () => {
  const dummyXml = "Xml"
  const s3Path = "Dummy Path"
  const s3DeleteItemSpy = jest.spyOn(fakeS3Gateway, "deleteItem")

  fakeS3Gateway.reset({
    [s3Path]: dummyXml
  })

  const result = await deleteFileFromS3UseCase.call(s3Path)
  expect(result).toNotBeError()
  expect(s3DeleteItemSpy).toHaveBeenCalledTimes(1)
})

it("should return error when an S3 gateway returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeS3Gateway.shouldReturnError(expectedError)
  const result = await deleteFileFromS3UseCase.call("Dummy Path")

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
