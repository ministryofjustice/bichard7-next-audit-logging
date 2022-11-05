import type { AuditLogEvent } from "src/shared/types"
import { validateAuditLogEvent } from "../utils"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogEvent: AuditLogEvent
}

export default (unvalidatedAuditLogEvent: AuditLogEvent): ValidationResult => {
  const { errors, auditLogEvent } = validateAuditLogEvent(unvalidatedAuditLogEvent)

  return {
    isValid: errors.length === 0,
    errors,
    auditLogEvent
  }
}
