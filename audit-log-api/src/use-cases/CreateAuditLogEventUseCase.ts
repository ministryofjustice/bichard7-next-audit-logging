import { AuditLogEvent, AuditLogDynamoGateway, isError } from "shared"
import { isConditionalExpressionViolationError } from "src/utils"

interface CreateAuditLogEventResult {
  resultType: "success" | "notFound" | "error"
  resultDescription?: string
}

export default class CreateAuditLogEventUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(messageId: string, event: AuditLogEvent): Promise<CreateAuditLogEventResult> {
    const result = await this.auditLogGateway.addEvent(messageId, event)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        return {
          resultType: "notFound",
          resultDescription: `A message with Id ${messageId} does not exist in the database`
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
