import { AuditLog, AuditLogEvent, AuditLogDynamoGateway, DynamoDbConfig, isError } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import CreateAuditLogEventUseCase from "./CreateAuditLogEventUseCase"

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const testDynamoGateway = new TestDynamoGateway(config)
const auditLogDynamoGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogEventUseCase = new CreateAuditLogEventUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "XML")
const createAuditLogEvent = (): AuditLogEvent =>
  new AuditLogEvent("information", new Date(), "Create audit log event test")

const getAuditLog = (messageId: string): Promise<AuditLog> =>
  testDynamoGateway.getOne(config.AUDIT_LOG_TABLE_NAME, "messageId", messageId)

describe("CreateAuditLogUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  it("should return success result when event is added to the audit log", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event = createAuditLogEvent()
    const result = await createAuditLogEventUseCase.create(auditLog.messageId, event)

    expect(isError(result)).toBe(false)

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog.events).toBeDefined()
    expect(actualAuditLog.events).toHaveLength(1)

    const actualEvent = actualAuditLog.events[0]
    expect(actualEvent.category).toBe(event.category)
    expect(actualEvent.timestamp).toBe(event.timestamp)
    expect(actualEvent.eventType).toBe(event.eventType)
  })

  it("should return not found result when audit log does not exist", async () => {
    const nonExistentMessageId = "11290b62-e8b8-47a8-ab24-6702a8fc6bba"
    const event = createAuditLogEvent()
    const result = await createAuditLogEventUseCase.create(nonExistentMessageId, event)

    expect(isError(result)).toBe(true)

    const error = <Error>result
    expect(error.name).toBe("notFound")
    expect(error.message).toBe(`A message with Id ${nonExistentMessageId} already exists in the database`)
  })

  it("should return an error result when an unknown error occurs within the database", async () => {
    const gateway = new AuditLogDynamoGateway(config, "Invalid Table Name")
    const useCase = new CreateAuditLogEventUseCase(gateway)

    const auditLog = createAuditLog()
    const event = createAuditLogEvent()

    const result = await useCase.create(auditLog.messageId, event)

    expect(isError(result)).toBe(true)

    const error = <Error>result
    expect(error.name).toBe("error")
    expect(error.message).toBeDefined()

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeNull()
  })
})
