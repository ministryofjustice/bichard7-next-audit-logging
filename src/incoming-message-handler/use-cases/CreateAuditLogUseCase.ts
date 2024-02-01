import type { ApiClient, InputApiAuditLog, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { AuditLogStatus, isError } from "src/shared/types"
import type { ValidationResult } from "../handlers/storeMessage"

export default class {
  constructor(private apiClient: ApiClient) {}

  async execute(auditLog: InputApiAuditLog): PromiseResult<ValidationResult> {
    const result = await this.apiClient.createAuditLog(auditLog)

    if (isError(result)) {
      return result
    }

    return { isValid: true, isDuplicate: result?.status === AuditLogStatus.duplicate }
  }
}
