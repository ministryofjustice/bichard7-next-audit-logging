import { AuditLog } from "shared-types"
import validateCreateAuditLog from "./validateCreateAuditLog"
import { FakeAuditLogDynamoGateway } from "shared-testing"

const dynamoGateway = new FakeAuditLogDynamoGateway()

describe("validateCreateAuditLog", () => {
  beforeEach(() => {
    dynamoGateway.reset()
  })

  it("should be valid when audit log item is valid", async () => {
    const item = new AuditLog("ECID", new Date(), "DummyHash")
    item.caseId = "CID"
    item.systemId = "DummySystemID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"
    const { errors, isValid, auditLog } = await validateCreateAuditLog(item, dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)

    expect(auditLog.messageId).toBe(item.messageId)
    expect(auditLog.externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLog.caseId).toBe(item.caseId)
    expect(auditLog.systemId).toBe(item.systemId)
    expect(auditLog.receivedDate).toBe(item.receivedDate)
    expect(auditLog.createdBy).toBe(item.createdBy)
    expect(auditLog.status).toBe(item.status)
    expect(auditLog.version).toBe(item.version)
    expect(auditLog.automationReport?.events).toHaveLength(0)
    expect(auditLog.topExceptionsReport?.events).toHaveLength(0)
    expect(auditLog.events).toHaveLength(0)
    expect(auditLog.messageHash).toBe(item.messageHash)
    expect(auditLog.s3Path).toBe(item.s3Path)
    expect(auditLog.externalId).toBe(item.externalId)
    expect(auditLog.stepExecutionId).toBe(item.stepExecutionId)
  })

  it("should be valid and override the value of fields that should be set internally", async () => {
    const item = new AuditLog("ECID", new Date("2021-10-15T10:12:13.000Z"), "DummyHash")
    item.caseId = "CID"
    item.systemId = "DummySystemID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"

    const itemToFix = {
      ...item,
      version: 10,
      status: "error",
      events: "dummyEvent",
      automationReport: "dummyAutomationReport",
      topExceptionsReport: "dummyTopExceptionsReport"
    } as unknown as AuditLog

    const { errors, isValid, auditLog } = await validateCreateAuditLog(itemToFix, dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLog).toBeDefined()
    expect(auditLog.messageId).toBe(item.messageId)
    expect(auditLog.caseId).toBe(item.caseId)
    expect(auditLog.systemId).toBe(item.systemId)
    expect(auditLog.externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLog.receivedDate).toEqual(item.receivedDate)
    expect(auditLog.status).toBe("Processing")
    expect(auditLog.version).toBe(0)
    expect(auditLog.events).toHaveLength(0)
    expect(auditLog.automationReport?.events).toHaveLength(0)
    expect(auditLog.topExceptionsReport?.events).toHaveLength(0)
  })

  it("should remove arbitrary keys from the audit log", async () => {
    let item = new AuditLog("ECID", new Date(), "DummyHash")
    item.caseId = "CID"
    item.systemId = "DummySystemID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"
    item = { ...item, randomKey1: "RandomValue", key2: 5 } as AuditLog
    const { errors, isValid, auditLog } = await validateCreateAuditLog(item, dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)

    expect(auditLog.messageId).toBe(item.messageId)
    expect(auditLog.externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLog.caseId).toBe(item.caseId)
    expect(auditLog.systemId).toBe(item.systemId)
    expect(auditLog.receivedDate).toBe(item.receivedDate)
    expect(auditLog.status).toBe(item.status)
    expect(auditLog.version).toBe(item.version)
    expect(auditLog.automationReport?.events).toHaveLength(0)
    expect(auditLog.topExceptionsReport?.events).toHaveLength(0)
    expect(auditLog.events).toHaveLength(0)
    expect(auditLog.messageHash).toBe(item.messageHash)

    const keys = Object.keys(auditLog)
    expect(keys).not.toContain("randomKey")
    expect(keys).not.toContain("key2")
  })

  it("should be invalid when mandatory fields do not have value", async () => {
    const item = {} as unknown as AuditLog
    const { errors, isValid } = await validateCreateAuditLog(item, dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(6)
    expect(errors).toContain("Case ID is mandatory")
    expect(errors).toContain("External Correlation ID is mandatory")
    expect(errors).toContain("Message ID is mandatory")
    expect(errors).toContain("Received date is mandatory")
    expect(errors).toContain("Created by is mandatory")
    expect(errors).toContain("Message hash is mandatory")
  })

  it("should be invalid when fields have incorrect format", async () => {
    const item = {
      messageId: 1,
      caseId: 2,
      systemId: 3,
      externalCorrelationId: 3,
      receivedDate: "2021-10-05 12:13:14",
      createdBy: 5,
      messageHash: 6,
      s3Path: 7,
      externalId: 8,
      stepExecutionId: 9
    } as unknown as AuditLog
    const { errors, isValid } = await validateCreateAuditLog(item, dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(10)
    expect(errors).toContain("Case ID must be string")
    expect(errors).toContain("System ID must be string")
    expect(errors).toContain("External Correlation ID must be string")
    expect(errors).toContain("Message ID must be string")
    expect(errors).toContain("Received date must be ISO format")
    expect(errors).toContain("Created by must be string")
    expect(errors).toContain("Message hash must be string")
    expect(errors).toContain("S3 path must be string")
    expect(errors).toContain("External ID must be string")
    expect(errors).toContain("Step execution ID must be string")
  })

  it("should enforce a length of 24 characters for the recieved date", async () => {
    const item = new AuditLog("ECID", new Date("2021-12-21T09:32:35.716101961Z"), "DummyHash")
    item.caseId = "CID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"
    const { errors, isValid, auditLog } = await validateCreateAuditLog(item, dynamoGateway)

    expect(errors).toStrictEqual([])
    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)

    expect(auditLog.receivedDate).toBe("2021-12-21T09:32:35.716Z")
    expect(auditLog.receivedDate).toHaveLength(24)
  })

  it("should be invalid if message hash exists in the database", async () => {
    const item = new AuditLog("ECID", new Date(), "DuplicateHash")
    item.caseId = "CID"
    item.systemId = "DummySystemID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"

    const duplicateItem = new AuditLog("ECID-2", new Date(), "DuplicateHash")
    item.caseId = "CID-2"
    item.systemId = "DummySystemID-2"
    item.createdBy = "Test-2"

    dynamoGateway.reset([duplicateItem])
    const { errors, isValid } = await validateCreateAuditLog(item, dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(1)
    expect(errors).toContain("Message hash already exists")
  })
})
