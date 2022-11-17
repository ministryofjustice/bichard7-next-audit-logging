import maxBy from "lodash.maxby"
import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { getForceOwner } from "../../utils"

export default (events: AuditLogEvent[]): Partial<DynamoAuditLog> => {
  const forceOwnerEvents = events.filter((event) => getForceOwner(event) !== undefined)
  const forceOwnerEvent = maxBy(forceOwnerEvents, (event) => event.timestamp)

  if (forceOwnerEvent) {
    return { forceOwner: getForceOwner(forceOwnerEvent) }
  }

  return {}
}
