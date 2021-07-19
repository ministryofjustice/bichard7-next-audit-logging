import type EventDetails from "./EventDetails"

export default interface GeneralEventLogItem {
  logEvent?: EventDetails
  auditEvent?: EventDetails
}
