import type { AuditLog, TransactionFailureReason } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import { isConditionalExpressionViolationError, isTransactionFailedError } from "../gateways/dynamo"

interface CreateAuditLogsResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
  failureReasons?: TransactionFailureReason[]
}

export default class CreateAuditLogsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(auditLogs: AuditLog[]): Promise<CreateAuditLogsResult> {
    const result = await this.auditLogGateway.createMany(auditLogs)

    let toReturn: CreateAuditLogsResult = {
      resultType: "success"
    }

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        toReturn = {
          resultType: "conflict",
          resultDescription: "A conflict occurred when creating audit logs"
        }
      } else {
        toReturn = {
          resultType: "error",
          resultDescription: result.message
        }
      }

      if (isTransactionFailedError(result)) {
        toReturn.failureReasons = result.failureReasons
      }
    }

    return toReturn
  }
}
