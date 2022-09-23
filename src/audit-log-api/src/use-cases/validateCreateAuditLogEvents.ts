import type { AuditLogEvent } from "shared-types"
import { validateAuditLogEvent } from "../utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogEvents: AuditLogEvent[]
}

export default (unvalidatedAuditLogEvents: AuditLogEvent[]): ValidationResult => {
  const validationErrors: string[] = []
  const validatedAuditLogEvents = unvalidatedAuditLogEvents.map((unvalidatedAuditLogEvent) => {
    const { errors, auditLogEvent } = validateAuditLogEvent(unvalidatedAuditLogEvent)
    validationErrors.push(...errors)
    return auditLogEvent
  })

  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    auditLogEvents: validatedAuditLogEvents
  }
}
