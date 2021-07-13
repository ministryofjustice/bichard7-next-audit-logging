import createTestDynamoGateway from "src/createTestDynamoGateway"
import { AuditLog, isError } from "../../../shared/dist"
import getMessageById from "./getMessageById"

const gateway = createTestDynamoGateway()

it("returns undefined when messageId does not have value", async () => {
  const result = await getMessageById(gateway, "")

  expect(isError(result)).toBe(false)
  expect(result).toBeUndefined()
})

it("returns the message when messageId exists in the database", async () => {
  const expectedMessage = new AuditLog("External correlation id", new Date(), "Xml")
  jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedMessage)
  const result = await getMessageById(gateway, "Valid message Id")

  expect(isError(result)).toBe(false)
  expect(result).toBeDefined()

  const actualMessage = <AuditLog>result
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
})

it("returns error when an error has occured in the database", async () => {
  const expectedError = new Error("Error")
  jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedError)
  const result = await getMessageById(gateway, "message Id")

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(actualError.message)
})
