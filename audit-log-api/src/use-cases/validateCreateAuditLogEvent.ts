import type { AuditLogEvent, BichardAuditLogEvent } from "shared"
import { isIsoDate } from "src/utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogEvent: AuditLogEvent
}

export default (auditLogEvent: AuditLogEvent): ValidationResult => {
  const errors: string[] = []
  const event = auditLogEvent as BichardAuditLogEvent

  if (event.attributes && (typeof event.attributes !== "object" || Array.isArray(event.attributes))) {
    errors.push("Attributes must be key/value object")
  }

  if (!event.category) {
    errors.push("Category is mandatory")
  } else if (!["information", "error", "warning"].includes(event.category)) {
    errors.push("Category can be either information, error, or warning")
  }

  if (!event.eventSource) {
    errors.push("Event source is mandatory")
  } else if (typeof event.eventSource !== "string") {
    errors.push("Event source must be string")
  }

  if (event.eventSourceArn && typeof event.eventSourceArn !== "string") {
    errors.push("event source ARN must be string")
  }

  if (event.eventSourceQueueName && typeof event.eventSourceQueueName !== "string") {
    errors.push("Event source queue name must be string")
  }

  if (!event.eventType) {
    errors.push("Event type is mandatory")
  } else if (typeof event.eventType !== "string") {
    errors.push("Event type must be string")
  }

  if (event.s3Path && typeof event.s3Path !== "string") {
    errors.push("S3 path must be string")
  }

  if (!event.timestamp) {
    errors.push("Timestamp is mandatory")
  } else if (!isIsoDate(event.timestamp)) {
    errors.push("Timestamp must be ISO format")
  }

  let validatedAuditLogEvent = { ...event } as BichardAuditLogEvent

  if (!validatedAuditLogEvent.attributes) {
    validatedAuditLogEvent = { ...validatedAuditLogEvent, attributes: {} } as BichardAuditLogEvent
  }

  return {
    isValid: errors.length === 0,
    errors,
    auditLogEvent: validatedAuditLogEvent
  }
}
