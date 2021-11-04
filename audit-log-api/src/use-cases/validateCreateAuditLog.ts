import type { AuditLog } from "shared"
import { AuditLogStatus } from "shared"
import { isIsoDate } from "src/utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLog: AuditLog
}

export default (auditLog: AuditLog): ValidationResult => {
  const errors: string[] = []

  if (!auditLog.caseId) {
    errors.push("Case ID is mandatory")
  } else if (typeof auditLog.caseId !== "string") {
    errors.push("Case ID must be string")
  }

  if (!auditLog.externalCorrelationId) {
    errors.push("External Correlation ID is mandatory")
  } else if (typeof auditLog.externalCorrelationId !== "string") {
    errors.push("External Correlation ID must be string")
  }

  if (!auditLog.messageId) {
    errors.push("Message ID is mandatory")
  } else if (typeof auditLog.messageId !== "string") {
    errors.push("Message ID must be string")
  }

  if (!auditLog.messageXml) {
    errors.push("Message XML is mandatory")
  } else if (typeof auditLog.messageXml !== "string") {
    errors.push("Message XML must be string")
  }

  if (!auditLog.receivedDate) {
    errors.push("Received date is mandatory")
  } else if (!isIsoDate(auditLog.receivedDate)) {
    errors.push("Received date must be ISO format")
  }

  const validatedAuditLog: AuditLog = {
    ...auditLog,
    status: AuditLogStatus.processing,
    version: 0,
    events: [],
    automationReport: { events: [] },
    topExceptionsReport: { events: [] }
  }

  return {
    isValid: errors.length === 0,
    errors,
    auditLog: validatedAuditLog
  }
}
