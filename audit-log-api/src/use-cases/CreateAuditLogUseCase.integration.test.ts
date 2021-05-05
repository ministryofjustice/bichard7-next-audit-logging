import { AuditLog, AuditLogDynamoGateway, DynamoDbConfig } from "shared"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const auditLogDynamoGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "XML")

describe("CreateAuditLogUseCase", () => {
  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogUseCase.create(auditLog)

    expect(result.resultType).toBe("conflict")
    expect(result.resultDescription).toBe(`A message with Id ${auditLog.messageId} already exists in the database`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const expectedError = new Error("Expected Error")
    jest.spyOn(AuditLogDynamoGateway.prototype, "create").mockResolvedValue(Promise.resolve(expectedError))

    const auditLog = createAuditLog()

    const result = await createAuditLogUseCase.create(auditLog)

    expect(result.resultType).toBe("error")
    expect(result.resultDescription).toBe(expectedError.message)
  })

  it("should return a success result when the record is stored in the database", async () => {
    const auditLog = createAuditLog()

    const result = await createAuditLogUseCase.create(auditLog)

    expect(result.resultType).toBe("success")
    expect(result.resultDescription).toBeUndefined()
  })
})
