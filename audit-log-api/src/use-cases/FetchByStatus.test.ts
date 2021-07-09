import { AuditLogStatus, AuditLog, isError } from "shared"
import createTestDynamoGateway from "src/createTestDynamoGateway"
import FetchByStatus from "./FetchByStatus"

const gateway = createTestDynamoGateway()

it("should return one message when there is a message with the specified status", async () => {
  const expectedStatus = AuditLogStatus.error
  const expectedMessage = new AuditLog("1", new Date(), "Xml")
  expectedMessage.status = expectedStatus
  jest.spyOn(gateway, "fetchByStatus").mockResolvedValue([expectedMessage])
  jest.spyOn(gateway, "fetchOne").mockResolvedValue(new AuditLog("test id", new Date(), "Xml"))

  const messageFetcher = new FetchByStatus(gateway, expectedStatus, "messageId")
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(false)

  const actualMessages = <AuditLog[]>result
  expect(actualMessages).toHaveLength(1)

  const actualMessage = actualMessages[0]
  expect(actualMessage.messageId).toBe(expectedMessage.messageId)
  expect(actualMessage.status).toBe(expectedStatus)
})

it("should return an error when fetchByStatus fails", async () => {
  const expectedError = new Error("Results not found")
  jest.spyOn(gateway, "fetchByStatus").mockResolvedValue(expectedError)

  const messageFetcher = new FetchByStatus(gateway, AuditLogStatus.processing)
  const result = await messageFetcher.fetch()

  expect(isError(result)).toBe(true)
  expect(result).toBe(expectedError)
})
