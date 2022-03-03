import { AuditLog, isError } from "shared-types"
import { FakeAuditLogDynamoGateway } from "shared-testing"
import FetchByHash from "./FetchByHash"

const gateway = new FakeAuditLogDynamoGateway()

it("should return one message when hash exists", async () => {
  const expectedMessage = new AuditLog("1", new Date(), "Dummy hash")
  gateway.reset([expectedMessage])

  const messageFetcher = new FetchByHash(gateway, expectedMessage.messageHash)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <AuditLog>result
  expect(actualMessage.messageHash).toBe("dummy-hash")
})

it("should return an error when fetchByHash fails", async () => {
  const expectedError = new Error("Results not found")
  gateway.shouldReturnError(expectedError)

  const messageFetcher = new FetchByHash(gateway, "Message hash")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
