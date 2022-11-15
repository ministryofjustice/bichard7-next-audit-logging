import type { AuditLogEvent, OutputApiAuditLog, Result } from "src/shared/types"
import config from "../config"

export default (message: OutputApiAuditLog): Result<boolean> => {
  let retryTime: number

  const hasFailedEvent = (message.events as AuditLogEvent[]).some(
    (event) => event.category === "error" && (!!event.eventXml || "s3Path" in event) && !!event.eventSourceQueueName
  )
  if (!hasFailedEvent) {
    return false
  }

  const retryEvents = message.events.filter((m) => m.eventType === "Retrying failed message")

  if (retryEvents.length >= config.maxRetryAttempts) {
    return false
  }

  try {
    if (retryEvents.length === 0) {
      retryTime = Date.parse(message.receivedDate) + config.initialRetryDelay
    } else {
      retryTime = Date.parse(retryEvents.slice(-1)[0].timestamp) + config.retryDelay
    }
  } catch (e) {
    return e as Error
  }

  if (retryTime < Date.now()) {
    return true
  }
  return false
}
