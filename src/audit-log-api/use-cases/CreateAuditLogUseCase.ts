import type { DynamoAuditLog, InputApiAuditLog } from "src/shared/types"
import { AuditLogStatus, PncStatus, TriggerStatus, isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { isConditionalExpressionViolationError } from "../gateways/dynamo"

interface CreateAuditLogResult {
  resultType: "success" | "conflict" | "error"
  resultDescription?: string
}

const transformInput = (input: InputApiAuditLog): DynamoAuditLog => ({
  events: [],
  eventsCount: 0,
  version: 0,
  ...input,
  pncStatus: input.status === AuditLogStatus.duplicate ? PncStatus.Duplicate : PncStatus.Processing,
  triggerStatus: input.status === AuditLogStatus.duplicate ? TriggerStatus.Duplicate : TriggerStatus.NoTriggers
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
