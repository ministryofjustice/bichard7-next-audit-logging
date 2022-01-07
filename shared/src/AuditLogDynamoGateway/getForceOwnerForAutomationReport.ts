import type { AuditLogEvent } from "shared-types"

export default (event: AuditLogEvent): string | undefined => {
  if (event.eventType === "Input message received") {
    return event.attributes["Force Owner"] as string
  }

  return undefined
}
