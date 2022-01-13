import type { AuditLogEvent, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import { isConditionalExpressionViolationError } from "../utils"

interface CreateAuditLogEventResult {
  resultType: "success" | "notFound" | "invalidVersion" | "error"
  resultDescription?: string
}

export default class CreateAuditLogEventUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(messageId: string, event: AuditLogEvent): Promise<CreateAuditLogEventResult> {
    const messageVersion = await this.auditLogGateway.fetchVersion(messageId)

    if (isError(messageVersion)) {
      return {
        resultType: "error",
        resultDescription: messageVersion.message
      }
    }

    if (messageVersion === null) {
      return {
        resultType: "notFound",
        resultDescription: `A message with Id ${messageId} does not exist in the database`
      }
    }

    const result = await this.auditLogGateway.addEvent(messageId, messageVersion, event)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        return {
          resultType: "invalidVersion",
          resultDescription: `Message with Id ${messageId} has a different version in the database.`
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
