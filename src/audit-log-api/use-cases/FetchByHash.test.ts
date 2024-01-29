import { mockDynamoAuditLog } from "src/shared/testing"
import type { DynamoAuditLog } from "src/shared/types"
import { isError } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import FetchByHash from "./FetchByHash"

const gateway = new FakeAuditLogDynamoGateway()

it("should return one message when messageHash exists", async () => {
  const expectedMessage = mockDynamoAuditLog()
  gateway.reset([expectedMessage])

  const messageFetcher = new FetchByHash(gateway, expectedMessage.messageHash)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <DynamoAuditLog[]>result
  expect(actualMessage).toHaveLength(1)
  expect(actualMessage[0].messageId).toBe(expectedMessage.messageId)
})

it("should return an error when fetchOne fails", async () => {
  const expectedError = new Error("Results not found")
  gateway.shouldReturnError(expectedError)

  const messageFetcher = new FetchByHash(gateway, "Invalid hash")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
