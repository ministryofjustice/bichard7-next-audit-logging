import type { DynamoAuditLog, InputApiAuditLog } from "src/shared/types"
import { AuditLogStatus, isError, PncStatus, TriggerStatus } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { isConditionalExpressionViolationError } from "../gateways/dynamo"

interface CreateAuditLogResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
}

const transformInput = (input: InputApiAuditLog): DynamoAuditLog => ({
  events: [],
  pncStatus: PncStatus.Processing,
  status: AuditLogStatus.processing,
  triggerStatus: TriggerStatus.NoTriggers,
  version: 0,
  ...input
})

export default class CreateAuditLogUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGatewayInterface) {}

  async create(auditLog: InputApiAuditLog): Promise<CreateAuditLogResult> {
    const result = await this.auditLogGateway.create(transformInput(auditLog))

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
