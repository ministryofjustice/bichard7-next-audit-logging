import { AuditLog, isError } from "shared-types"
import { FakeAuditLogDynamoGateway } from "shared-testing"
import FetchAll from "./FetchAll"

const gateway = new FakeAuditLogDynamoGateway()

it("should return all messages", async () => {
  const expectedMessages = [
    new AuditLog("1", new Date(), "Xml"),
    new AuditLog("2", new Date(), "Xml"),
    new AuditLog("3", new Date(), "Xml")
  ]
  gateway.reset(expectedMessages)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(3)
})

it("should return an error when fetchMany fails", async () => {
  const expectedError = new Error("Results not found")
  gateway.shouldReturnError(expectedError)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
