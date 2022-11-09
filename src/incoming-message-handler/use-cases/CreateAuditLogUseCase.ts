import type { ApiClient, AuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { ValidationResult } from "../handlers/storeMessage"

export default class {
  constructor(private apiClient: ApiClient) {}

  async execute(auditLog: AuditLog): PromiseResult<ValidationResult> {
    const result = await this.apiClient.createAuditLog(auditLog)

    if (result && isError(result)) {
      if (/Message hash already exists/i.test(result.message)) {
        return {
          isValid: false,
          message: `There is a message with the same hash in the database (${auditLog.messageHash})`
        }
      }

      return result
    }

    return { isValid: true }
  }
}