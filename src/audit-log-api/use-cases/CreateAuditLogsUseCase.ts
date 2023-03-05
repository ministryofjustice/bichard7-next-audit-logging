import type { DynamoAuditLog, InputApiAuditLog, TransactionFailureReason } from "src/shared/types"
import { AuditLogStatus, isError, PncStatus, TriggerStatus } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { isConditionalExpressionViolationError, isTransactionFailedError } from "../gateways/dynamo"

interface CreateAuditLogsResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
  failureReasons?: TransactionFailureReason[]
}

const transformInput = (input: InputApiAuditLog): DynamoAuditLog => ({
  events: [],
  eventsCount: 0,
  pncStatus: PncStatus.Processing,
  status: AuditLogStatus.processing,
  triggerStatus: TriggerStatus.NoTriggers,
  version: 0,
  ...input
})

export default class CreateAuditLogsUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  async create(auditLogs: InputApiAuditLog[]): Promise<CreateAuditLogsResult> {
    const result = await this.auditLogGateway.createMany(auditLogs.map(transformInput))

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
