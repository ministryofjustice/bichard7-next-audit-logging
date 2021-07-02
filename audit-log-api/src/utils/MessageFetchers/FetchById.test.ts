import { FetchMessagesUseCase } from "src/use-cases"
import { AuditLog, AuditLogDynamoGateway, isError } from "shared"
import { FetchById } from "."

it("should return one message when messageId exists", async () => {
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
  jest.spyOn(fetchMessages, "getById").mockResolvedValue(expectedMessage)

  const messageFetcher = new FetchById(fetchMessages, expectedMessage.messageId)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessage = <AuditLog>result
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
})
