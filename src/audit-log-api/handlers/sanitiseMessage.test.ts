jest.mock("../use-cases/FetchById")

import type { APIGatewayProxyEvent } from "aws-lambda"
import { HttpStatusCode } from "src/shared"
import { setEnvironmentVariables } from "src/shared/testing"
import "../testConfig"
import FetchById from "../use-cases/FetchById"
setEnvironmentVariables()

import sanitiseMessage from "./sanitiseMessage"

const createProxyEvent = (messageId?: string): APIGatewayProxyEvent => {
  return <APIGatewayProxyEvent>JSON.parse(
    JSON.stringify({
      pathParameters: {
        messageId
      }
    })
  )
}

test("returns BadRequest error when there is no message ID passed", async () => {
  const event = createProxyEvent(undefined)

  const result = await sanitiseMessage(event)

  expect(result.statusCode).toBe(HttpStatusCode.badRequest)
  expect(result.body).toBe("No message ID in request")
})

test("returns Internal Server error when there is an error from Dynamo", async () => {
  const expectedError = "Something bad happened"
  jest.spyOn(FetchById.prototype, "fetch").mockResolvedValue(new Error(expectedError))
  const event = createProxyEvent("MessageId")

  const result = await sanitiseMessage(event)

  expect(result.statusCode).toBe(HttpStatusCode.internalServerError)
  expect(result.body).toBe(expectedError)
})
