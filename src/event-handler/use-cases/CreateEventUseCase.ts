import { logger } from "src/shared"
import type { ApiAuditLogEvent, ApiClient, PromiseResult } from "src/shared/types"

export default class {
  constructor(private readonly api: ApiClient) {}

  execute(messageId: string, event: ApiAuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      const userName = event.attributes?.["User ID"]
      if (userName) {
        return this.api.createUserEvent(String(userName), event)
      }

      logger.info(`No messageId or userName: ${JSON.stringify(event)}`)
      return Promise.resolve(undefined)
    }

    return this.api.createEvent(messageId, event)
  }
}
