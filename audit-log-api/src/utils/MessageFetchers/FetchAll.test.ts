import { AuditLog, AuditLogDynamoGateway, isError } from "shared"
import { FetchMessagesUseCase } from "src/use-cases"
import { FetchAll } from "."

it("should return all messages", async () => {
  const expectedMessages = [
    new AuditLog("1", new Date(), "Xml"),
    new AuditLog("2", new Date(), "Xml"),
    new AuditLog("3", new Date(), "Xml")
  ]
  const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
  jest.spyOn(fetchMessages, "get").mockResolvedValue(expectedMessages)

  const messageFetcher = new FetchAll(fetchMessages)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(3)
})
