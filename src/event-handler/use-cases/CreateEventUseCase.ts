import { logger } from "src/shared"
import type { ApiClient, AuditLogEvent, PromiseResult } from "src/shared/types"
import { AuditLog, isError } from "src/shared/types"

export default class {
  constructor(private readonly api: ApiClient) {}

  async execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      logger.info(`No messageId: ${JSON.stringify(event)}`)
      return undefined
    }

    // Create a message if message ID doesn't exist in the database
    // If message ID already exists, the API returns 409 error
    const message = {
      ...new AuditLog(messageId, new Date("1970-01-01T00:00:00.000Z"), messageId), // We don't have the message XML to compute the message hash
      messageId,
      caseId: "Unknown",
      createdBy: "Event handler",
      nextSanitiseCheck: new Date().toISOString()
    }
    const createAuditLogResult = await this.api.createAuditLog(message)

    if (
      isError(createAuditLogResult) &&
      /A message with Id .+ already exists/i.test(createAuditLogResult.message) === false &&
      /Message hash already exists/i.test(createAuditLogResult.message) === false
    ) {
      return createAuditLogResult
    }

    return this.api.createEvent(messageId, event)
  }
}
