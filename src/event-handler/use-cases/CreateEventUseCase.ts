import { logger } from "src/shared"
import type { ApiClient, AuditLogEvent, PromiseResult } from "src/shared/types"

export default class {
  constructor(private readonly api: ApiClient) {}

  execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      logger.info(`No messageId: ${JSON.stringify(event)}`)
      return Promise.resolve(undefined)
    }

    return this.api.createEvent(messageId, event)
  }
}
