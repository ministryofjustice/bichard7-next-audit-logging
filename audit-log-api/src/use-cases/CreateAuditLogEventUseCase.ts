import { AuditLogEvent, AuditLogDynamoGateway, isError } from "shared"

interface CreateAuditLogEventResult {
  resultType: "success" | "error"
  resultDescription?: string
}

export default class CreateAuditLogUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(messageId: string, event: AuditLogEvent): Promise<CreateAuditLogEventResult> {
    const result = await this.auditLogGateway.addEvent(messageId, event)

    if (isError(result)) {
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
