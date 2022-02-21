import { AuditLog } from "shared-types"
import validateCreateAuditLog from "./validateCreateAuditLog"

it("should be valid when audit log item is valid", () => {
  const item = new AuditLog("ECID", new Date())
  item.caseId = "CID"
  item.systemId = "DummySystemID"
  item.createdBy = "Test"
  const { errors, isValid, auditLog } = validateCreateAuditLog(item)

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
})

it("should be valid and override the value of fields that should be set internally", () => {
  const item = new AuditLog("ECID", new Date("2021-10-15T10:12:13.000Z"))
  item.caseId = "CID"
  item.systemId = "DummySystemID"
  item.createdBy = "Test"

  const itemToFix = {
    ...item,
    version: 10,
    status: "error",
    events: "dummyEvent",
    automationReport: "dummyAutomationReport",
    topExceptionsReport: "dummyTopExceptionsReport"
  } as unknown as AuditLog

  const { errors, isValid, auditLog } = validateCreateAuditLog(itemToFix)

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

it("should remove arbitrary keys from the audit log", () => {
  let item = new AuditLog("ECID", new Date())
  item.caseId = "CID"
  item.systemId = "DummySystemID"
  item.createdBy = "Test"
  item = { ...item, randomKey1: "RandomValue", key2: 5 } as AuditLog
  const { errors, isValid, auditLog } = validateCreateAuditLog(item)

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

  const keys = Object.keys(auditLog)
  expect(keys).not.toContain("randomKey")
  expect(keys).not.toContain("key2")
})

it("should be invalid when mandatory fields do not have value", () => {
  const item = {} as unknown as AuditLog
  const { errors, isValid } = validateCreateAuditLog(item)

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(5)
  expect(errors).toContain("Case ID is mandatory")
  expect(errors).toContain("External Correlation ID is mandatory")
  expect(errors).toContain("Message ID is mandatory")
  expect(errors).toContain("Received date is mandatory")
  expect(errors).toContain("Created by is mandatory")
})

it("should be invalid when fields have incorrect format", () => {
  const item = {
    messageId: 1,
    caseId: 2,
    systemId: 3,
    externalCorrelationId: 3,
    receivedDate: "2021-10-05 12:13:14",
    createdBy: 5
  } as unknown as AuditLog
  const { errors, isValid } = validateCreateAuditLog(item)

  expect(isValid).toBe(false)
  expect(errors).toHaveLength(6)
  expect(errors).toContain("Case ID must be string")
  expect(errors).toContain("System ID must be string")
  expect(errors).toContain("External Correlation ID must be string")
  expect(errors).toContain("Message ID must be string")
  expect(errors).toContain("Received date must be ISO format")
  expect(errors).toContain("Created by must be string")
})

it("should enforce a length of 24 characters for the recieved date", () => {
  const item = new AuditLog("ECID", new Date("2021-12-21T09:32:35.716101961Z"))
  item.caseId = "CID"
  item.createdBy = "Test"
  const { errors, isValid, auditLog } = validateCreateAuditLog(item)

  expect(isValid).toBe(true)
  expect(errors).toHaveLength(0)

  expect(auditLog.receivedDate).toBe("2021-12-21T09:32:35.716Z")
  expect(auditLog.receivedDate).toHaveLength(24)
})
