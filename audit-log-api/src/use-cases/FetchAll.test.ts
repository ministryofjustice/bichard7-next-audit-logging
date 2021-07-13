jest.mock("src/use-cases/getMessageById")

import { AuditLog, isError } from "shared"
import createTestDynamoGateway from "src/createTestDynamoGateway"
import getMessageById from "./getMessageById"
import FetchAll from "./FetchAll"

const gateway = createTestDynamoGateway()

it("should return all messages", async () => {
  const expectedMessages = [
    new AuditLog("1", new Date(), "Xml"),
    new AuditLog("2", new Date(), "Xml"),
    new AuditLog("3", new Date(), "Xml")
  ]
  const mockGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>
  mockGetMessageById.mockResolvedValue(new AuditLog("test id", new Date(), "Xml"))
  jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedMessages)

  const messageFetcher = new FetchAll(gateway, "messageId")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(3)
})

it("should return an error when fetchMany fails", async () => {
  const expectedError = new Error("Results not found")
  const mockGetMessageById = getMessageById as jest.MockedFunction<typeof getMessageById>
  mockGetMessageById.mockResolvedValue(undefined)
  jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
