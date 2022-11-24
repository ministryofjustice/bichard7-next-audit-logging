import { ApiAuditLogEvent, EventCode } from "src/shared/types"

export const parseForceOwner = (forceOwner: string): number | undefined => {
  if (forceOwner.match(/^\d{2}/)) {
    return Number(forceOwner.substring(0, 2))
  }
  return undefined
}

export default (event: ApiAuditLogEvent): number | undefined => {
  if (event.eventCode === EventCode.HearingOutcomeDetails) {
    const forceOwner = event.attributes?.["Force Owner"] as string
    return parseForceOwner(forceOwner)
  }

  return undefined
}
