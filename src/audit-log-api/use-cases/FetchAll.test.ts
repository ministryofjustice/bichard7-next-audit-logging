import { AuditLog, isError } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import FetchAll from "./FetchAll"

const gateway = new FakeAuditLogDynamoGateway()

it("should return all messages", async () => {
  const expectedMessages = [
    new AuditLog("1", new Date(), "Dummy hash 1"),
    new AuditLog("2", new Date(), "Dummy hash 2"),
    new AuditLog("3", new Date(), "Dummy hash 3")
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
