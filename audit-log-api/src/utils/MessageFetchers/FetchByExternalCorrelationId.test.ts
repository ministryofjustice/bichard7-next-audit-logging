import { FetchMessagesUseCase } from "src/use-cases"
import { AuditLog, AuditLogDynamoGateway, isError } from "shared"
import { FetchByExternalCorrelationId } from "."

it("should return one message when externalCorrelationId exists", async () => {
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
  jest.spyOn(fetchMessages, "getByExternalCorrelationId").mockResolvedValue(expectedMessage)

  const messageFetcher = new FetchByExternalCorrelationId(fetchMessages, expectedMessage.externalCorrelationId)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <AuditLog>result
  expect(actualMessage.externalCorrelationId).toBe("1")
})
