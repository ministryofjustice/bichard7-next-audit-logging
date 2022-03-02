import type { AuditLog } from "shared-types"
import { AuditLogStatus } from "shared-types"
import { isIsoDate } from "../utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLog: AuditLog
}

export default (auditLog: AuditLog): ValidationResult => {
  const errors: string[] = []
  let formattedReceivedDate = ""
  const {
    caseId,
    systemId,
    externalCorrelationId,
    messageId,
    receivedDate,
    createdBy,
    s3Path,
    stepExecutionId,
    externalId,
    hash
  } = auditLog

  if (!caseId) {
    errors.push("Case ID is mandatory")
  } else if (typeof caseId !== "string") {
    errors.push("Case ID must be string")
  }

  if (systemId && typeof systemId !== "string") {
    errors.push("System ID must be string")
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

  if (!receivedDate) {
    errors.push("Received date is mandatory")
  } else if (!isIsoDate(receivedDate)) {
    errors.push("Received date must be ISO format")
  } else {
    formattedReceivedDate = new Date(receivedDate).toISOString()
  }

  if (!createdBy) {
    errors.push("Created by is mandatory")
  } else if (typeof createdBy !== "string") {
    errors.push("Created by must be string")
  }

  if (!hash) {
    errors.push("Hash is mandatory")
  } else if (typeof hash !== "string") {
    errors.push("Hash must be string")
  }

  // Don't validate these for now so we don't break during a deploy
  // if (!s3Path) {
  //   errors.push("s3Path is mandatory")
  // } else if (typeof createdBy !== "string") {
  //   errors.push("s3Path must be string")
  // }

  // if (!externalId) {
  //   errors.push("externalId is mandatory")
  // } else if (typeof createdBy !== "string") {
  //   errors.push("externalId must be string")
  // }

  // if (!stepExecutionId) {
  //   errors.push("stepExecutionId is mandatory")
  // } else if (typeof createdBy !== "string") {
  //   errors.push("stepExecutionId must be string")
  // }

  const validatedAuditLog: AuditLog = {
    messageId,
    caseId,
    systemId,
    s3Path,
    externalId,
    stepExecutionId,
    externalCorrelationId,
    receivedDate: formattedReceivedDate || receivedDate,
    createdBy,
    status: AuditLogStatus.processing,
    lastEventType: "",
    version: 0,
    retryCount: 0,
    events: [],
    automationReport: { events: [] },
    topExceptionsReport: { events: [] },
    hash
  }

  return {
    isValid: errors.length === 0,
    errors,
    auditLog: validatedAuditLog
  }
}
