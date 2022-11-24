import type { ApiAuditLogEvent } from "src/shared/types"
import { validateAuditLogEvent } from "../utils"

export interface EventValidationResult {
  timestamp: string
  errors: string[]
  auditLogEvent: ApiAuditLogEvent
}

export interface ValidationResult {
  isValid: boolean
  eventValidationResults: EventValidationResult[]
}

export default (unvalidatedAuditLogEvents: ApiAuditLogEvent[]): ValidationResult => {
  const validationResults: EventValidationResult[] = unvalidatedAuditLogEvents.map((unvalidatedAuditLogEvent) => {
    const { errors, auditLogEvent } = validateAuditLogEvent(unvalidatedAuditLogEvent)
    return {
      timestamp: auditLogEvent.timestamp || "No event timestamp given",
      errors,
      auditLogEvent
    }
  })

  return {
    isValid: !validationResults.some((result) => result.errors.length > 0),
    eventValidationResults: validationResults
  }
}
