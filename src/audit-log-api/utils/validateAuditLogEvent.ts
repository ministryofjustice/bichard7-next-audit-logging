import type { AuditLogEvent, BichardAuditLogEvent } from "src/shared/types"
import isIsoDate from "./isIsoDate"

type ValidationResult = {
  errors: string[]
  auditLogEvent: AuditLogEvent
}

export default (auditLogEvent: AuditLogEvent): ValidationResult => {
  const errors: string[] = []
  const {
    attributes,
    category,
    eventCode,
    eventSource,
    eventSourceArn,
    eventSourceQueueName,
    eventType,
    eventXml,
    timestamp,
    user
  } = auditLogEvent as BichardAuditLogEvent

  if (attributes && (typeof attributes !== "object" || Array.isArray(attributes))) {
    errors.push("Attributes must be key/value object")
  }

  if (!category) {
    errors.push("Category is mandatory")
  } else if (!["information", "error", "warning"].includes(category)) {
    errors.push("Category can be either information, error, or warning")
  }

  if (eventCode && typeof eventCode !== "string") {
    errors.push("Event code must be string")
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

  if (eventXml && typeof eventXml !== "string") {
    errors.push("Event XML must be string")
  }

  if (!timestamp) {
    errors.push("Timestamp is mandatory")
  } else if (!isIsoDate(timestamp)) {
    errors.push("Timestamp must be ISO format")
  }

  if (user && typeof user !== "string") {
    errors.push("User must be string")
  }

  let validatedAuditLogEvent = {
    attributes,
    category,
    eventCode,
    eventSource,
    eventSourceArn,
    eventSourceQueueName,
    eventType,
    eventXml,
    timestamp,
    user
  } as BichardAuditLogEvent

  if (!validatedAuditLogEvent.attributes) {
    validatedAuditLogEvent = { ...validatedAuditLogEvent, attributes: {} } as BichardAuditLogEvent
  }

  Object.keys(validatedAuditLogEvent).forEach(
    (key) => (validatedAuditLogEvent as never)[key] === undefined && delete (validatedAuditLogEvent as never)[key]
  )

  return {
    errors,
    auditLogEvent: validatedAuditLogEvent
  }
}
