import { AuditLog } from "shared-types"
import validateCreateAuditLogs from "./validateCreateAuditLogs"
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
    const { errors, isValid, auditLogs } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLogs).toHaveLength(1)

    expect(auditLogs[0].messageId).toBe(item.messageId)
    expect(auditLogs[0].externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLogs[0].caseId).toBe(item.caseId)
    expect(auditLogs[0].systemId).toBe(item.systemId)
    expect(auditLogs[0].receivedDate).toBe(item.receivedDate)
    expect(auditLogs[0].createdBy).toBe(item.createdBy)
    expect(auditLogs[0].status).toBe(item.status)
    expect(auditLogs[0].version).toBe(item.version)
    expect(auditLogs[0].automationReport?.events).toHaveLength(0)
    expect(auditLogs[0].topExceptionsReport?.events).toHaveLength(0)
    expect(auditLogs[0].events).toHaveLength(0)
    expect(auditLogs[0].messageHash).toBe(item.messageHash)
    expect(auditLogs[0].s3Path).toBe(item.s3Path)
    expect(auditLogs[0].externalId).toBe(item.externalId)
    expect(auditLogs[0].stepExecutionId).toBe(item.stepExecutionId)
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

    const { errors, isValid, auditLogs } = await validateCreateAuditLogs([itemToFix], dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLogs).toHaveLength(1)
    expect(auditLogs[0]).toBeDefined()
    expect(auditLogs[0].messageId).toBe(item.messageId)
    expect(auditLogs[0].caseId).toBe(item.caseId)
    expect(auditLogs[0].systemId).toBe(item.systemId)
    expect(auditLogs[0].externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLogs[0].receivedDate).toEqual(item.receivedDate)
    expect(auditLogs[0].status).toBe("Processing")
    expect(auditLogs[0].version).toBe(0)
    expect(auditLogs[0].events).toHaveLength(0)
    expect(auditLogs[0].automationReport?.events).toHaveLength(0)
    expect(auditLogs[0].topExceptionsReport?.events).toHaveLength(0)
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
    const { errors, isValid, auditLogs } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLogs).toHaveLength(1)

    expect(auditLogs[0].messageId).toBe(item.messageId)
    expect(auditLogs[0].externalCorrelationId).toBe(item.externalCorrelationId)
    expect(auditLogs[0].caseId).toBe(item.caseId)
    expect(auditLogs[0].systemId).toBe(item.systemId)
    expect(auditLogs[0].receivedDate).toBe(item.receivedDate)
    expect(auditLogs[0].status).toBe(item.status)
    expect(auditLogs[0].version).toBe(item.version)
    expect(auditLogs[0].automationReport?.events).toHaveLength(0)
    expect(auditLogs[0].topExceptionsReport?.events).toHaveLength(0)
    expect(auditLogs[0].events).toHaveLength(0)
    expect(auditLogs[0].messageHash).toBe(item.messageHash)

    const keys = Object.keys(auditLogs[0])
    expect(keys).not.toContain("randomKey")
    expect(keys).not.toContain("key2")
  })

  it("should be invalid when mandatory fields do not have value", async () => {
    const item = {} as unknown as AuditLog
    const { errors, isValid } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(7)
    expect(errors).toContain("Case ID is mandatory")
    expect(errors).toContain("External Correlation ID is mandatory")
    expect(errors).toContain("Message ID is mandatory")
    expect(errors).toContain("Received date is mandatory")
    expect(errors).toContain("Next sanitise check is mandatory")
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
      nextSanitiseCheck: "2021-10-05 12:13:14",
      createdBy: 5,
      messageHash: 6,
      s3Path: 7,
      externalId: 8,
      stepExecutionId: 9
    } as unknown as AuditLog
    const { errors, isValid } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(11)
    expect(errors).toContain("Case ID must be string")
    expect(errors).toContain("System ID must be string")
    expect(errors).toContain("External Correlation ID must be string")
    expect(errors).toContain("Message ID must be string")
    expect(errors).toContain("Received date must be ISO format")
    expect(errors).toContain("Next sanitise check must be ISO format")
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
    const { errors, isValid, auditLogs } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(errors).toStrictEqual([])
    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLogs).toHaveLength(1)

    expect(auditLogs[0].receivedDate).toBe("2021-12-21T09:32:35.716Z")
    expect(auditLogs[0].receivedDate).toHaveLength(24)
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
    item.s3Path = "Dummy S3 path-2"
    item.externalId = "Dummy external ID-2"
    item.stepExecutionId = "Dummy step execution ID-2"

    dynamoGateway.reset([duplicateItem])
    const { errors, isValid } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(1)
    expect(errors).toContain("Message hash already exists")
  })

  it("should be invalid if couldn't validate message hash", async () => {
    const item = new AuditLog("ECID", new Date(), "DuplicateHash")
    item.caseId = "CID"
    item.systemId = "DummySystemID"
    item.createdBy = "Test"
    item.s3Path = "Dummy S3 path"
    item.externalId = "Dummy external ID"
    item.stepExecutionId = "Dummy step execution ID"

    const expectedError = new Error("Unknown error")
    dynamoGateway.reset()
    dynamoGateway.shouldReturnError(expectedError)
    const { errors, isValid } = await validateCreateAuditLogs([item], dynamoGateway)

    expect(isValid).toBe(false)
    expect(errors).toHaveLength(1)
    expect(errors).toContain("Couldn't validate message hash")
  })

  it("should be valid when all audit log items are valid", async () => {
    const items = new Array(10).fill(0).map((_, idx) => {
      const item = new AuditLog(`ECID${idx}`, new Date(), `DummyHash${idx}`)
      item.caseId = "CID"
      item.systemId = "DummySystemID"
      item.createdBy = "Test"
      item.s3Path = "Dummy S3 path"
      item.externalId = "Dummy external ID"
      item.stepExecutionId = "Dummy step execution ID"
      return item
    })

    const { errors, isValid, auditLogs } = await validateCreateAuditLogs(items, dynamoGateway)

    expect(isValid).toBe(true)
    expect(errors).toHaveLength(0)
    expect(auditLogs).toHaveLength(10)

    auditLogs.forEach((auditLog, idx) => {
      expect(auditLog.messageId).toBe(items[idx].messageId)
      expect(auditLog.externalCorrelationId).toBe(items[idx].externalCorrelationId)
      expect(auditLog.caseId).toBe(items[idx].caseId)
      expect(auditLog.systemId).toBe(items[idx].systemId)
      expect(auditLog.receivedDate).toBe(items[idx].receivedDate)
      expect(auditLog.createdBy).toBe(items[idx].createdBy)
      expect(auditLog.status).toBe(items[idx].status)
      expect(auditLog.version).toBe(items[idx].version)
      expect(auditLog.automationReport?.events).toHaveLength(0)
      expect(auditLog.topExceptionsReport?.events).toHaveLength(0)
      expect(auditLog.events).toHaveLength(0)
      expect(auditLog.messageHash).toBe(items[idx].messageHash)
      expect(auditLog.s3Path).toBe(items[idx].s3Path)
      expect(auditLog.externalId).toBe(items[idx].externalId)
      expect(auditLog.stepExecutionId).toBe(items[idx].stepExecutionId)
    })
  })
})
