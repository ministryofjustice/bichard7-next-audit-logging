import { AuditLog } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "Dummy hash")

const getAuditLog = (messageId: string): Promise<AuditLog | null> =>
  testDynamoGateway.getOne(auditLogDynamoConfig.auditLogTableName, "messageId", messageId)

describe("CreateAuditLogUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
  })

  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogUseCase.create(auditLog)

    expect(result.resultType).toBe("conflict")
    expect(result.resultDescription).toBe(`A message with Id ${auditLog.messageId} already exists in the database`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AuditLogDynamoGateway({ ...auditLogDynamoConfig, auditLogTableName: "Invalid Table Name" })
    const useCase = new CreateAuditLogUseCase(gateway)

    const auditLog = createAuditLog()

    const result = await useCase.create(auditLog)

    expect(result.resultType).toBe("error")
    expect(result.resultDescription).toBeDefined()

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeNull()
  })

  it("should return a success result when the record is stored in the database", async () => {
    const expectedAuditLog = createAuditLog()

    const result = await createAuditLogUseCase.create(expectedAuditLog)

    expect(result.resultType).toBe("success")
    expect(result.resultDescription).toBeUndefined()

    const actualAuditLog = await getAuditLog(expectedAuditLog.messageId)
    expect(actualAuditLog?.messageId).toBe(expectedAuditLog.messageId)
    expect(actualAuditLog?.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
    expect(actualAuditLog?.caseId).toBe(expectedAuditLog.caseId)
    expect(actualAuditLog?.receivedDate).toBe(expectedAuditLog.receivedDate)
  })
})
