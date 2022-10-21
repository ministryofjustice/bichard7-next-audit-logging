import type { AuditLogEvent } from "shared-types"
import shouldLogForTopExceptionsReport from "../shouldLogForTopExceptionsReport"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const topExceptionsReportEvents = events.filter((event) => shouldLogForTopExceptionsReport(event))
  if (topExceptionsReportEvents.length > 0) {
    return {
      updateExpressionValues: { ":topExceptionEvents": topExceptionsReportEvents },
      updateExpression:
        "topExceptionsReport.events = list_append(if_not_exists(topExceptionsReport.events, :empty_list), :topExceptionEvents)"
    }
  }

  return {}
}