import type { BichardAuditLogEvent, Result } from "src/shared/types"

export default (event: BichardAuditLogEvent): Result<void> => {
  if (event.category !== "error") {
    return new Error("This message has not failed and cannot be retried")
  }

  const { s3Path } = event as unknown as { s3Path: string }
  if ((!event.eventXml && !s3Path) || !event.eventSourceQueueName) {
    return new Error("Failed to retrieve the source event, so unable to retry")
  }

  return undefined
}
