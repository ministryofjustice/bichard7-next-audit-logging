import type { ApiAuditLogEvent, ApiClient, PromiseResult } from "src/shared/types"

export default class {
  constructor(private readonly api: ApiClient) {}

  execute(messageId: string, event: ApiAuditLogEvent): PromiseResult<void> {
    if (messageId) {
      return this.api.createEvent(messageId, event)
    }

    const userName = event.attributes?.user || event.attributes?.["User ID"]
    if (userName) {
      return this.api.createUserEvent(String(userName), event)
    }

    throw Error(`No messageId or userName: ${JSON.stringify(event)}`)
  }
}
