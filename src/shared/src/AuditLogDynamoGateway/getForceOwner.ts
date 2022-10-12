import type { AuditLogEvent } from "shared-types"
import { EventType, EventTypeV2 } from "shared-types"

export const parseForceOwner = (forceOwner: string): number | undefined => {
  if (forceOwner.match(/^\d{2}/)) {
    return Number(forceOwner.substring(0, 2))
  }
  return undefined
}

export default (event: AuditLogEvent): number | undefined => {
  if (event.eventType === EventType.InputMessageReceived || event.eventType === EventTypeV2.HearingOutcomeDetails) {
    const forceOwner = event.attributes["Force Owner"] as string
    return parseForceOwner(forceOwner)
  }

  return undefined
}
