import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"

export default (event: AuditLogEvent): string | undefined => {
  if (event.eventType === EventType.InputMessageReceived) {
    return event.attributes["Force Owner"] as string
  }

  return undefined
}
