import { AuditLogEvent, AuditLogDynamoGateway, isError } from "shared"

interface CreateAuditLogEventResult {
  resultType: "success" | "notFound" | "error"
  resultDescription?: string
}

const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.message === "The conditional request failed"

export default class CreateAuditLogUseCase {
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
