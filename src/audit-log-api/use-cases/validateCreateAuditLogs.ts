import type { InputApiAuditLog } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import validateCreateAuditLog from "./validateCreateAuditLog"

interface ValidationResult {
  isValid: boolean
  errors: string[]
  auditLogs: InputApiAuditLog[]
}

// dynamodb limit https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html#transaction-apis-txwriteitems
const MAX_AUDIT_LOGS = 25

export default async (
  auditLogs: InputApiAuditLog[],
  dynamoGateway: AuditLogDynamoGatewayInterface
): Promise<ValidationResult> => {
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    return {
      isValid: false,
      errors: ["Too many audit logs to create in one transaction"],
      auditLogs
    }
  }

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
