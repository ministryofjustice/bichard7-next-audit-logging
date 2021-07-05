import { AuditLog, isError } from "shared"
import createTestDynamoGateway from "src/createTestDynamoGateway"
import FetchAll from "./FetchAll"

const gateway = createTestDynamoGateway()

it("should return all messages", async () => {
  const expectedMessages = [
    new AuditLog("1", new Date(), "Xml"),
    new AuditLog("2", new Date(), "Xml"),
    new AuditLog("3", new Date(), "Xml")
  ]
  jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedMessages)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(3)
})

it("should return an error when fetchMany fails", async () => {
  const expectedError = new Error("Results not found")
  jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
