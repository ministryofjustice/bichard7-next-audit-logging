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
  const { caseId, externalCorrelationId, messageId, messageXml, receivedDate } = auditLog

  if (!caseId) {
    errors.push("Case ID is mandatory")
  } else if (typeof caseId !== "string") {
    errors.push("Case ID must be string")
  }

  if (!externalCorrelationId) {
    errors.push("External Correlation ID is mandatory")
  } else if (typeof externalCorrelationId !== "string") {
    errors.push("External Correlation ID must be string")
  }

  if (!messageId) {
    errors.push("Message ID is mandatory")
  } else if (typeof messageId !== "string") {
    errors.push("Message ID must be string")
  }

  if (!messageXml) {
    errors.push("Message XML is mandatory")
  } else if (typeof messageXml !== "string") {
    errors.push("Message XML must be string")
  }

  if (!receivedDate) {
    errors.push("Received date is mandatory")
  } else if (!isIsoDate(receivedDate)) {
    errors.push("Received date must be ISO format")
  }

  const validatedAuditLog: AuditLog = {
    messageId,
    caseId,
    externalCorrelationId,
    messageXml,
    receivedDate,
    status: AuditLogStatus.processing,
    lastEventType: "",
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
