import type { PromiseResult, Result, AuditLogEvent, ApiClient } from "shared-types"
import { AuditLog, isError } from "shared-types"
import { logger } from "shared"

export default class {
  constructor(private readonly api: ApiClient) {}

  // Retry up to retryLimit times
  async execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    const retryLimit = 5
    let result: Result<void> = Error(`Failed to create event with message id ${messageId}`)
    for (let i = 0; i < retryLimit; i++) {
      result = await this.executeOnce(messageId, event)
      if (!isError(result) || !result.message.startsWith("Timed out creating event for message with Id")) {
        return result
      }
    }
    return result
  }

  async executeOnce(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      logger.info(`No messageId: ${JSON.stringify(event)}`)
      return undefined
    }

    // Create a message if message ID doesn't exist in the database
    // If message ID already exists, the API returns 409 error
    const message = {
      ...new AuditLog(messageId, new Date("1970-01-01T00:00:00.000Z"), "Unknown"),
      messageId,
      caseId: "Unknown",
      createdBy: "Event handler"
    }
    const createAuditLogResult = await this.api.createAuditLog(message)
    if (isError(createAuditLogResult) && createAuditLogResult.message !== "Request failed with status code 409") {
      return createAuditLogResult
    }

    return this.api.createEvent(messageId, event)
  }
}
