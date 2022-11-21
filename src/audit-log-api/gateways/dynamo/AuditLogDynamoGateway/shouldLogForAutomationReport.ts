import type { ApiAuditLogEvent } from "src/shared/types"

const automationReportEventCodes = ["exceptions.generated", "exceptions.resolved", "pnc.updated"]

export default (event: ApiAuditLogEvent): boolean => {
  return !!event.eventCode && automationReportEventCodes.includes(event.eventCode)
}

export { automationReportEventCodes }
