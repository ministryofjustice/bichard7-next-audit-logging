import { mockDynamoAuditLog } from "src/shared/testing"
import { AuditLogStatus, PncStatus, type DynamoAuditLog, TriggerStatus } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogDynamoGateway)

const getAuditLog = (messageId: string): Promise<DynamoAuditLog | null> =>
  testDynamoGateway.getOne(auditLogDynamoConfig.auditLogTableName, "messageId", messageId)

describe("CreateAuditLogUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
  })

  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = mockDynamoAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogUseCase.create(auditLog)

    expect(result.resultType).toBe("conflict")
    expect(result.resultDescription).toBe(`A message with Id ${auditLog.messageId} already exists in the database`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AuditLogDynamoGateway({ ...auditLogDynamoConfig, auditLogTableName: "Invalid Table Name" })
    const useCase = new CreateAuditLogUseCase(gateway)

    const auditLog = mockDynamoAuditLog()

    const result = await useCase.create(auditLog)

    expect(result.resultType).toBe("error")
    expect(result.resultDescription).toBeDefined()

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeNull()
  })

  it("should return a success result when the record is stored in the database", async () => {
    const expectedAuditLog = mockDynamoAuditLog()

    const result = await createAuditLogUseCase.create(expectedAuditLog)

    expect(result.resultType).toBe("success")
    expect(result.resultDescription).toBeUndefined()

    const actualAuditLog = await getAuditLog(expectedAuditLog.messageId)
    expect(actualAuditLog?.messageId).toBe(expectedAuditLog.messageId)
    expect(actualAuditLog?.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
    expect(actualAuditLog?.caseId).toBe(expectedAuditLog.caseId)
    expect(actualAuditLog?.receivedDate).toBe(expectedAuditLog.receivedDate)
  })

  it("should set the PNC and trigger statuses to duplicate when audit log status is duplicate", async () => {
    const expectedAuditLog = mockDynamoAuditLog({ status: AuditLogStatus.duplicate })

    const result = await createAuditLogUseCase.create(expectedAuditLog)

    expect(result.resultType).toBe("success")
    expect(result.resultDescription).toBeUndefined()

    const actualAuditLog = await getAuditLog(expectedAuditLog.messageId)
    expect(actualAuditLog?.messageId).toBe(expectedAuditLog.messageId)
    expect(actualAuditLog?.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
    expect(actualAuditLog?.caseId).toBe(expectedAuditLog.caseId)
    expect(actualAuditLog?.receivedDate).toBe(expectedAuditLog.receivedDate)
    expect(actualAuditLog?.status).toBe(AuditLogStatus.duplicate)
    expect(actualAuditLog?.pncStatus).toBe(PncStatus.Duplicate)
    expect(actualAuditLog?.triggerStatus).toBe(TriggerStatus.Duplicate)
  })
})
