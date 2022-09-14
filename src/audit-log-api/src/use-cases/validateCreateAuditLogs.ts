import type { AuditLog, AuditLogDynamoGateway } from "shared-types"
import validateCreateAuditLog from "./validateCreateAuditLog"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogs: AuditLog[]
}

export default async (auditLogs: AuditLog[], dynamoGateway: AuditLogDynamoGateway): Promise<ValidationResult> => {
  return (
    await Promise.all(
      auditLogs.map(async (auditLog) => {
        const {
          isValid: currentIsValid,
          errors: currentErrors,
          auditLog: validatedAuditLog
        } = await validateCreateAuditLog(auditLog, dynamoGateway)
        return { isValid: currentIsValid, errors: currentErrors, auditLogs: [validatedAuditLog] }
      })
    )
  ).reduce((previousValue: ValidationResult, currentValue: ValidationResult) => {
    return {
      isValid: previousValue.isValid && currentValue.isValid,
      errors: previousValue.errors.concat(currentValue.errors),
      auditLogs: previousValue.auditLogs.concat(currentValue.auditLogs)
    }
  })
}
