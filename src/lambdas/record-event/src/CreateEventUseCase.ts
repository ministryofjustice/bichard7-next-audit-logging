import type { ApiClient } from "@bichard/api-client"
import type { PromiseResult, AuditLogEvent } from "shared"
import { PollOptions, Poller, AuditLog, isError } from "shared"

export default class {
  constructor(private readonly api: ApiClient) {}

  async execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (!messageId) {
      console.log(event)
      return undefined
    }

    let message = await this.api.getMessage(messageId)

    if (isError(message)) {
      return message
    }

    if (!message) {
      message = {
        ...new AuditLog(messageId, new Date("1970-01-01T00:00:00.000Z"), "Unknown"),
        messageId,
        caseId: "Unknown",
        createdBy: "Event handler"
      }
      const createAuditLogResult = await this.api.createAuditLog(message)

      if (isError(createAuditLogResult)) {
        return createAuditLogResult
      }
    }

    const createEventResult = await this.api.createEvent(messageId, event)

    return createEventResult
  }

  retryExecute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    let retries = 0
    const pollAction = () => {
      retries += 1
      return this.execute(messageId, event)
    }
    const pollOptions = new PollOptions(10000)
    pollOptions.delay = 1000
    pollOptions.condition = (result) =>
      retries >= 3 || !isError(result) || result.message !== "Request failed with status code 409"

    return new Poller(pollAction).poll(pollOptions)
  }
}
