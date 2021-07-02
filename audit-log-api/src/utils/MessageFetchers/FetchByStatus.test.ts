import { FetchMessagesUseCase } from "src/use-cases"
import { AuditLogStatus, AuditLog, AuditLogDynamoGateway, isError } from "shared"
import FetchByStatus from "./FetchByStatus"

it("should return one message when there is a message with the specified status", async () => {
  const expectedStatus = AuditLogStatus.error
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  expectedMessage.status = expectedStatus
  const fetchMessages = new FetchMessagesUseCase(<AuditLogDynamoGateway>{})
  jest.spyOn(fetchMessages, "getByStatus").mockResolvedValue([expectedMessage])

  const messageFetcher = new FetchByStatus(fetchMessages, expectedStatus)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toHaveLength(1)

  const actualMessage = actualMessages[0]
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
  expect(actualMessage.status).toBe(expectedStatus)
})
