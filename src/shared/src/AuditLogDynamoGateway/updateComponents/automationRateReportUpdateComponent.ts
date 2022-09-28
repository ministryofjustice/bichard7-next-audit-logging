import type { AuditLogEvent } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"
import shouldLogForAutomationReport from "../shouldLogForAutomationReport"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const automationReportEvents = events.filter((event) => shouldLogForAutomationReport(event))
  if (automationReportEvents.length > 0) {
    return {
      updateExpressionValues: { ":automationReportEvents": automationReportEvents },
      updateExpression:
        "automationReport.events = list_append(if_not_exists(automationReport.events, :empty_list), :automationReportEvents)"
    }
  }

  return {}
}
