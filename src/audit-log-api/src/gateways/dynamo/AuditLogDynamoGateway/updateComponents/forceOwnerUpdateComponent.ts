import maxBy from "lodash.maxby"
import type { AuditLogEvent } from "shared-types"
import getForceOwner from "../getForceOwner"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const forceOwnerEvents = events.filter((event) => getForceOwner(event) !== undefined)
  const forceOwnerEvent = maxBy(forceOwnerEvents, (event) => event.timestamp)

  if (forceOwnerEvent) {
    return {
      updateExpressionValues: { ":forceOwner": getForceOwner(forceOwnerEvent) },
      updateExpression: "forceOwner = :forceOwner"
    }
  }

  return {}
}
