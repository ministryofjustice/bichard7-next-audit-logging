import maxBy from "lodash.maxby"
import type { DynamoAuditLog, DynamoAuditLogEvent } from "src/shared/types"
import { getForceOwner } from "../../utils"

export default (events: DynamoAuditLogEvent[]): Partial<DynamoAuditLog> => {
  const forceOwnerEvents = events.filter((event) => getForceOwner(event) !== undefined)
  const forceOwnerEvent = maxBy(forceOwnerEvents, (event) => event.timestamp)

  if (forceOwnerEvent) {
    return { forceOwner: getForceOwner(forceOwnerEvent) }
  }

  return {}
}
