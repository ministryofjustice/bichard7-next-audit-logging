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
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
    expect(actualMessage.caseId).toBe(expectedMessage.caseId)
    expect(actualMessage.receivedDate).toContain("2021-03-24")
  })

  it("should return an error when fetchMany fails", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchMany").mockResolvedValue(expectedError)

    const result = await useCase.get()

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })

  it("should get one message", async () => {
    const expectedMessage = new AuditLog("id", new Date(Date.parse("2021-03-24")), "XML")
    expectedMessage.caseId = "123"

    jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedMessage)

    const result = await useCase.getById("id")

    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
    expect(actualMessage.caseId).toBe(expectedMessage.caseId)
    expect(actualMessage.receivedDate).toContain("2021-03-24")
  })

  it("should return an error when fetchOne fails", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchOne").mockResolvedValue(expectedError)

    const result = await useCase.getById("Invalid")

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })

  it("should get the messages by status", async () => {
    const expectedMessage = new AuditLog("id", new Date(Date.parse("2021-03-24")), "XML")
    expectedMessage.caseId = "123"

    jest.spyOn(gateway, "fetchByStatus").mockResolvedValue([expectedMessage])

    const result = await useCase.getByStatus("Processing")

    expect(isError(result)).toBe(false)

    const actualMessages = <AuditLog[]>result
    const actualMessage = actualMessages[0]

    expect(actualMessages).toHaveLength(1)
    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
    expect(actualMessage.caseId).toBe(expectedMessage.caseId)
    expect(actualMessage.receivedDate).toContain("2021-03-24")
    expect(actualMessage.status).toBe("Processing")
  })

  it("should return an error when fetchByStatus fails", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchByStatus").mockResolvedValue(expectedError)

    const result = await useCase.getByStatus("Processing")

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })

  it("should get the messages by external correlation id", async () => {
    const expectedMessage = new AuditLog("id", new Date(Date.parse("2021-03-24")), "XML")
    expectedMessage.caseId = "123"

    jest.spyOn(gateway, "fetchByExternalCorrelationId").mockResolvedValue(expectedMessage)

    const result = await useCase.getByExternalCorrelationId("External correlation id")

    expect(result).toBeDefined()
    expect(isError(result)).toBe(false)

    const actualMessage = <AuditLog>result

    expect(actualMessage.messageId).toBe(expectedMessage.messageId)
    expect(actualMessage.externalCorrelationId).toBe(expectedMessage.externalCorrelationId)
    expect(actualMessage.caseId).toBe(expectedMessage.caseId)
    expect(actualMessage.receivedDate).toContain("2021-03-24")
    expect(actualMessage.status).toBe("Processing")
  })

  it("should return an error when fetchByExternalCorrelationId fails", async () => {
    const expectedError = new Error("Results not found")
    jest.spyOn(gateway, "fetchByExternalCorrelationId").mockResolvedValue(expectedError)

    const result = await useCase.getByExternalCorrelationId("External correlation id")

    expect(isError(result)).toBe(true)
    expect(result).toBe(expectedError)
  })
})
