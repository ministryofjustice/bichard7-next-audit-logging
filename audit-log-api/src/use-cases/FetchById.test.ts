import { AuditLog, isError } from "shared"
import createTestDynamoGateway from "src/createTestDynamoGateway"
import FetchById from "./FetchById"

const gateway = createTestDynamoGateway()

it("should return one message when messageId exists", async () => {
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedMessage)

  const messageFetcher = new FetchById(gateway, expectedMessage.messageId)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <AuditLog>result
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
})

it("should return an error when fetchOne fails", async () => {
  const expectedError = new Error("Results not found")
  jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedError)

  const messageFetcher = new FetchById(gateway, "Invalid id")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
