import { mockDynamoAuditLog } from "src/shared/testing"
import { isError, OutputApiAuditLog } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import getMessageById from "./getMessageById"

const gateway = new FakeAuditLogDynamoGateway()

beforeEach(() => {
  gateway.reset()
})

it("returns undefined when messageId does not have value", async () => {
  const result = await getMessageById(gateway, "")

  expect(isError(result)).toBe(false)
  expect(result).toBeUndefined()
})

it("returns the message when messageId exists in the database", async () => {
  const expectedMessage = mockDynamoAuditLog()
  gateway.reset([expectedMessage])
  const result = await getMessageById(gateway, expectedMessage.messageId)

  expect(isError(result)).toBe(false)
  expect(result).toBeDefined()

  const actualMessage = <OutputApiAuditLog>result
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
})

it("returns error when an error has occured in the database", async () => {
  const expectedError = new Error("Error")
  gateway.shouldReturnError(expectedError)
  const result = await getMessageById(gateway, "message Id")

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(actualError.message)
})
