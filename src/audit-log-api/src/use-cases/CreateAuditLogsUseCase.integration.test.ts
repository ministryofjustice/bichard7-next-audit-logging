jest.retryTimes(10)
import type { DynamoDbConfig } from "shared-types"
import { AuditLog } from "shared-types"
import { AwsAuditLogDynamoGateway } from "shared"
import { TestDynamoGateway } from "shared"
import CreateAuditLogsUseCase from "./CreateAuditLogsUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const testDynamoGateway = new TestDynamoGateway(config)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(config, config.TABLE_NAME)
const createAuditLogsUseCase = new CreateAuditLogsUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "Dummy hash")

const getAuditLog = (messageId: string): Promise<AuditLog | null> =>
  testDynamoGateway.getOne(config.TABLE_NAME, "messageId", messageId)

describe("CreateAuditLogsUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(config.TABLE_NAME, "messageId")
  })

  it("should return a conflict result when an Audit Log record exists with the same messageId", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const result = await createAuditLogsUseCase.create([auditLog])

    expect(result.resultType).toBe("conflict")
    expect(result.resultDescription).toBe(`A conflict occurred`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AwsAuditLogDynamoGateway(config, "Invalid Table Name")
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
})
