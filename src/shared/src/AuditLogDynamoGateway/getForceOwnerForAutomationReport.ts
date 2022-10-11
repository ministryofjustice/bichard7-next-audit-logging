import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"

export default (event: AuditLogEvent): number | undefined => {
  if (event.eventType === EventType.InputMessageReceived) {
    return Number((event.attributes["Force Owner"] as string).substring(0, 2))
  }

  return undefined
}
