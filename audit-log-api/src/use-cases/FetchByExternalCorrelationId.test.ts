import { AuditLog, isError } from "shared"
import createTestDynamoGateway from "src/createTestDynamoGateway"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"

const gateway = createTestDynamoGateway()

it("should return one message when externalCorrelationId exists", async () => {
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  jest.spyOn(gateway, "fetchByExternalCorrelationId").mockResolvedValue(expectedMessage)

  const messageFetcher = new FetchByExternalCorrelationId(gateway, expectedMessage.externalCorrelationId)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <AuditLog>result
  expect(actualMessage.externalCorrelationId).toBe("1")
})

it("should return an error when fetchByExternalCorrelationId fails", async () => {
  const expectedError = new Error("Results not found")
  jest.spyOn(gateway, "fetchByExternalCorrelationId").mockResolvedValue(expectedError)

  const messageFetcher = new FetchByExternalCorrelationId(gateway, "External correlation id")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
