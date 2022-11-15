import { mockDynamoAuditLog } from "src/shared/testing"
import { isError } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import FetchAll from "./FetchAll"

const gateway = new FakeAuditLogDynamoGateway()

it("should return all messages", async () => {
  const expectedMessages = [mockDynamoAuditLog(), mockDynamoAuditLog(), mockDynamoAuditLog()]
  gateway.reset(expectedMessages)

  const messageFetcher = new FetchAll(gateway)
  const result = await messageFetcher.fetch()

  expect(result).toNotBeError()

  const actualMessages = result
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
