import { isError, DynamoDbConfig, AuditLog, AuditLogDynamoGateway } from "shared"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const gateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const useCase = new FetchMessagesUseCase(gateway)

describe("FetchMessagesUseCase", () => {
  it("should get the messages", async () => {
    const expectedMessage = new AuditLog("id", new Date(Date.parse("2021-03-24")), "XML")
    expectedMessage.caseId = "123"

    jest.spyOn(gateway, "fetchMany").mockResolvedValue([expectedMessage])

    const result = await useCase.get()

    expect(isError(result)).toBe(false)

    const actualMessages = <AuditLog[]>result
    const actualMessage = actualMessages[0]

    expect(actualMessages).toHaveLength(1)
    expect(actualMessage.messageId).toEqual(expectedMessage.messageId)
    expect(actualMessage.caseId).toEqual(expectedMessage.caseId)
    expect(actualMessage.receivedDate.toISOString()).toContain("2021-03-24")
  })

  it("should fail when the error is unknown", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

    const result = await useCase.get()

    expect(isError(result)).toBe(true)
    expect(result).toEqual(expectedError)
  })
})
