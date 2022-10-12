import maxBy from "lodash.maxby"
import type { AuditLogEvent } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"
import getForceOwner from "../getForceOwner"

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
