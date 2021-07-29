import type { BichardAuditLogEvent, Result } from "shared"

export default (event: BichardAuditLogEvent): Result<void> => {
  if (event.category !== "error") {
    return new Error("This message has not failed and cannot be retried")
  }

  if (!event.s3Path || !event.eventSourceQueueName) {
    return new Error("Failed to retrieve the source event, so unable to retry")
  }

  return undefined
}
