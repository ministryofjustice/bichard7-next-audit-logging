import type { PromiseResult, AuditLogEvent, ApiClient } from "shared-types"
import { AuditLog, isError } from "shared-types"

export default class {
  constructor(private readonly api: ApiClient) {}

  async execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      console.log(event)
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

    const createEventResult = await this.api.createEvent(messageId, event)

    return createEventResult
  }
}
