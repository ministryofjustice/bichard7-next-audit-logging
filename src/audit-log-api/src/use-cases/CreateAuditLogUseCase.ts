import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { isConditionalExpressionViolationError } from "../gateways/dynamo"

interface CreateAuditLogResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
}

export default class CreateAuditLogUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  async create(auditLog: AuditLog): Promise<CreateAuditLogResult> {
    const result = await this.auditLogGateway.create(auditLog)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        return {
          resultType: "conflict",
          resultDescription: `A message with Id ${auditLog.messageId} already exists in the database`
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
