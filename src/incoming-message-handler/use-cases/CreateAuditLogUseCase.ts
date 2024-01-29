import type { ApiClient, InputApiAuditLog, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { AuditLogStatus, isError } from "src/shared/types"
import type { ValidationResult } from "../handlers/storeMessage"

export default class {
  constructor(private apiClient: ApiClient) {}

  async execute(auditLog: InputApiAuditLog): PromiseResult<ValidationResult> {
    const result = await this.apiClient.createAuditLog(auditLog)

    if (result && isError(result)) {
      if (/Message hash already exists/i.test(result.message)) {
        return {
          isValid: false,
          isDuplicate: true,
          generateDuplicateEvent: true
        }
      }

      return result
    } else if ((result as OutputApiAuditLog)?.status === AuditLogStatus.duplicate) {
      return {
        isValid: false,
        isDuplicate: true,
        generateDuplicateEvent: false
      }
    }

    return { isValid: true }
  }
}
