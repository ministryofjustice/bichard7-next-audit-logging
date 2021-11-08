import type { AuditLogEvent, BichardAuditLogEvent } from "shared"
import { isIsoDate } from "src/utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogEvent: AuditLogEvent
}

export default (auditLogEvent: AuditLogEvent): ValidationResult => {
  const errors: string[] = []
  const {
    attributes,
    category,
    eventSource,
    eventSourceArn,
    eventSourceQueueName,
    eventType,
    s3Path,
    timestamp
  } = auditLogEvent as BichardAuditLogEvent

  if (attributes && (typeof attributes !== "object" || Array.isArray(attributes))) {
    errors.push("Attributes must be key/value object")
  }

  if (!category) {
    errors.push("Category is mandatory")
  } else if (!["information", "error", "warning"].includes(category)) {
    errors.push("Category can be either information, error, or warning")
  }

  if (!eventSource) {
    errors.push("Event source is mandatory")
  } else if (typeof eventSource !== "string") {
    errors.push("Event source must be string")
  }

  if (eventSourceArn && typeof eventSourceArn !== "string") {
    errors.push("event source ARN must be string")
  }

  if (eventSourceQueueName && typeof eventSourceQueueName !== "string") {
    errors.push("Event source queue name must be string")
  }

  if (!eventType) {
    errors.push("Event type is mandatory")
  } else if (typeof eventType !== "string") {
    errors.push("Event type must be string")
  }

  if (s3Path && typeof s3Path !== "string") {
    errors.push("S3 path must be string")
  }

  if (!timestamp) {
    errors.push("Timestamp is mandatory")
  } else if (!isIsoDate(timestamp)) {
    errors.push("Timestamp must be ISO format")
  }

  let validatedAuditLogEvent = {
    attributes,
    category,
    eventSource,
    eventSourceArn,
    eventSourceQueueName,
    eventType,
    s3Path,
    timestamp
  } as BichardAuditLogEvent

  if (!validatedAuditLogEvent.attributes) {
    validatedAuditLogEvent = { ...validatedAuditLogEvent, attributes: {} } as BichardAuditLogEvent
  }

  Object.keys(validatedAuditLogEvent).forEach(
    (key) => (validatedAuditLogEvent as never)[key] === undefined && delete (validatedAuditLogEvent as never)[key]
  )

  return {
    isValid: errors.length === 0,
    errors,
    auditLogEvent: validatedAuditLogEvent
  }
}
