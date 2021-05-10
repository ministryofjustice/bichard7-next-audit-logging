import { AuditLog, AuditLogDynamoGateway, DynamoDbConfig, isError } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const testDynamoGateway = new TestDynamoGateway(config)
const auditLogDynamoGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "XML")

const getAuditLog = (messageId: string): Promise<AuditLog> =>
  testDynamoGateway.getOne(config.AUDIT_LOG_TABLE_NAME, "messageId", messageId)

describe("CreateAuditLogUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogUseCase.create(auditLog)

    expect(isError(result)).toBe(true)

    const error = <Error>result
    expect(error.name).toBe("conflict")
    expect(error.message).toBe(`A message with Id ${auditLog.messageId} already exists in the database`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AuditLogDynamoGateway(config, "Invalid Table Name")
    const useCase = new CreateAuditLogUseCase(gateway)

    const auditLog = createAuditLog()

    const result = await useCase.create(auditLog)

    expect(isError(result)).toBe(true)

    const error = <Error>result
    expect(error.name).toBe("error")
    expect(error.message).toBeDefined()

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeNull()
  })

  it("should return a success result when the record is stored in the database", async () => {
    const expectedAuditLog = createAuditLog()

    const result = await createAuditLogUseCase.create(expectedAuditLog)

    expect(isError(result)).toBe(false)

    const actualAuditLog = await getAuditLog(expectedAuditLog.messageId)
    expect(actualAuditLog.messageId).toBe(expectedAuditLog.messageId)
    expect(actualAuditLog.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
    expect(actualAuditLog.caseId).toBe(expectedAuditLog.caseId)
    expect(actualAuditLog.receivedDate).toBe(expectedAuditLog.receivedDate)
    expect(actualAuditLog.messageXml).toBe(expectedAuditLog.messageXml)
  })
})
