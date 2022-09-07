import type { AuditLog, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError } from "../utils"

interface CreateAuditLogResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
}

export default class CreateAuditLogsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(auditLogs: AuditLog[]): Promise<CreateAuditLogResult> {
    const result = await this.auditLogGateway.createMany(auditLogs)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        return {
          resultType: "conflict",
          // TODO give information about _which_ item failed here
          resultDescription: `A conflict occurred`
        }
      }

      return {
        resultType: "error",
        resultDescription: result.message
      }
    }

    return {
      resultType: "success"
    }
  }
}
