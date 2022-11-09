jest.retryTimes(10)
import { AuditLog } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import CreateAuditLogsUseCase from "./CreateAuditLogsUseCase"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const createAuditLogsUseCase = new CreateAuditLogsUseCase(auditLogDynamoGateway)

const createAuditLog = (correlationId = "CorrelationId"): AuditLog =>
  new AuditLog(correlationId, new Date(), "Dummy hash")

const getAuditLog = (messageId: string): Promise<AuditLog | null> =>
  testDynamoGateway.getOne(auditLogDynamoConfig.auditLogTableName, "messageId", messageId)

describe("CreateAuditLogsUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
  })

  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogsUseCase.create([auditLog])

    expect(result.resultType).toBe("conflict")
    expect(result.resultDescription).toBe("A conflict occurred when creating audit logs")
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AuditLogDynamoGateway({ ...auditLogDynamoConfig, auditLogTableName: "Invalid Table Name" })
    const useCase = new CreateAuditLogsUseCase(gateway)

    const auditLog = createAuditLog()

    const result = await useCase.create([auditLog])

    expect(result.resultType).toBe("error")
    expect(result.resultDescription).toBeDefined()

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeNull()
  })

  it("should return a success result when the record is stored in the database", async () => {
    const expectedAuditLog = createAuditLog()

    const result = await createAuditLogsUseCase.create([expectedAuditLog])

    expect(result.resultType).toBe("success")
    expect(result.resultDescription).toBeUndefined()

    const actualAuditLog = await getAuditLog(expectedAuditLog.messageId)
    expect(actualAuditLog?.messageId).toBe(expectedAuditLog.messageId)
    expect(actualAuditLog?.externalCorrelationId).toBe(expectedAuditLog.externalCorrelationId)
    expect(actualAuditLog?.caseId).toBe(expectedAuditLog.caseId)
    expect(actualAuditLog?.receivedDate).toBe(expectedAuditLog.receivedDate)
  })

  it("should return a conflict result when one audit log in a batch is a duplicate", async () => {
    const expectedAuditLog = createAuditLog("id0")
    const initialResult = await createAuditLogsUseCase.create([expectedAuditLog])
    expect(initialResult.resultType).toBe("success")
    expect(initialResult.resultDescription).toBeUndefined()

    const expectedAuditLogs = new Array(10).fill(0).map((_, idx) => createAuditLog(`id${idx}`))
    Object.assign(expectedAuditLogs[0], { messageId: expectedAuditLog.messageId })
    const result = await createAuditLogsUseCase.create(expectedAuditLogs)

    expect(result.resultType).toBe("conflict")
    expect(result.failureReasons).toHaveLength(10)
    expect(result.failureReasons![0].Code).toBe("ConditionalCheckFailed")
    result.failureReasons!.slice(1).forEach((failureReason) => expect(failureReason.Code).toBe("None"))
  })
})
