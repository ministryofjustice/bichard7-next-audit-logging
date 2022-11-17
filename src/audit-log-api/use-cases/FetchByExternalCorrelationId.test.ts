import { mockDynamoAuditLog } from "src/shared/testing"
import { DynamoAuditLog, isError } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"

const gateway = new FakeAuditLogDynamoGateway()

it("should return one message when externalCorrelationId exists", async () => {
  const expectedMessage = mockDynamoAuditLog({ externalCorrelationId: "1" })
  gateway.reset([expectedMessage])

  const messageFetcher = new FetchByExternalCorrelationId(gateway, expectedMessage.externalCorrelationId)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <DynamoAuditLog>result
  expect(actualMessage.externalCorrelationId).toBe("1")
})

it("should return an error when fetchByExternalCorrelationId fails", async () => {
  const expectedError = new Error("Results not found")
  gateway.shouldReturnError(expectedError)

  const messageFetcher = new FetchByExternalCorrelationId(gateway, "External correlation id")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
