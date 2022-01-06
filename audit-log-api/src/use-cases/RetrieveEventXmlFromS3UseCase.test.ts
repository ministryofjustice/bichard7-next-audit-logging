import { FakeS3Gateway } from "shared-testing"
import { isError } from "shared"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"

const fakeS3Gateway = new FakeS3Gateway()
const useCase = new RetrieveEventXmlFromS3UseCase(fakeS3Gateway)

it("should return event xml when item exists in S3", async () => {
  const expectedXml = "Xml"
  const s3Path = "Dummy Path"

  fakeS3Gateway.reset({
    [s3Path]: expectedXml
  })
  const result = await useCase.retrieve(s3Path)

  expect(result).toNotBeError()
  expect(result).toBe(expectedXml)
})

it("should return error when an S3 gateway returns error", async () => {
  const expectedError = new Error("Dummy Error Message")

  fakeS3Gateway.shouldReturnError(expectedError)
  const result = await useCase.retrieve("Dummy Path")

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
