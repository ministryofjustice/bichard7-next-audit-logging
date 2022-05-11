import type { AuditLog, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { AuditLogStatus } from "shared-types"
import { logger } from "shared"
import { isIsoDate } from "../utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLog: AuditLog
}

export default async (auditLog: AuditLog, dynamoGateway: AuditLogDynamoGateway): Promise<ValidationResult> => {
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
    messageHash
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

  if (!messageHash) {
    errors.push("Message hash is mandatory")
  } else if (typeof messageHash !== "string") {
    errors.push("Message hash must be string")
  } else {
    const fetchByHashResult = await dynamoGateway.fetchByHash(messageHash)

    if (isError(fetchByHashResult)) {
      logger.error("Error validating message hash", fetchByHashResult)
      errors.push("Couldn't validate message hash")
    } else if (fetchByHashResult) {
      errors.push("Message hash already exists")
    }
  }

  if (s3Path && typeof s3Path !== "string") {
    errors.push("S3 path must be string")
  }

  if (externalId && typeof externalId !== "string") {
    errors.push("External ID must be string")
  }

  if (stepExecutionId && typeof stepExecutionId !== "string") {
    errors.push("Step execution ID must be string")
  }

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
    messageHash,
    isSanitised: 0,
    nextSanitiseCheck: formattedReceivedDate || receivedDate
  }

  return {
    isValid: errors.length === 0,
    errors,
    auditLog: validatedAuditLog
  }
}
