import "shared-testing"
import type { AWSError, S3 } from "aws-sdk"
import type { PromiseResult } from "aws-sdk/lib/request"
import { isError } from "shared"
import parseGetObjectResponse from "./parseGetObjectResponse"

it("should return the error when response body is empty", () => {
  const objectKey = "Dummy Key"
  const response = <PromiseResult<S3.GetObjectOutput, AWSError>>(<unknown>{
    Body: null
  })

  const result = parseGetObjectResponse(response, objectKey)

  expect(result).toBeDefined()
  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe(`Content is empty for key ${objectKey}.`)
})

it("should convert bytes to string when response body has value", () => {
  const objectKey = "Dummy Key"
  const expectedResponse = "String format"

  const response = <PromiseResult<S3.GetObjectOutput, AWSError>>(<unknown>{
    Body: Buffer.from(expectedResponse, "utf-8")
  })

  const result = parseGetObjectResponse(response, objectKey)

  expect(result).toNotBeError()
  expect(result).toBe(expectedResponse)
})
