import maxBy from "lodash.maxby"
import type { AuditLogEvent } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"
import getForceOwnerForAutomationReport from "../getForceOwnerForAutomationReport"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const forceOwnerEvents = events.filter((event) => getForceOwnerForAutomationReport(event) !== undefined)
  const forceOwnerEventForAutomationReport = maxBy(forceOwnerEvents, (event) => event.timestamp)

  if (forceOwnerEventForAutomationReport) {
    return {
      updateExpressionValues: { ":forceOwner": getForceOwnerForAutomationReport(forceOwnerEventForAutomationReport) },
      updateExpression: "forceOwner = :forceOwner"
    }
  }

  return {}
}
