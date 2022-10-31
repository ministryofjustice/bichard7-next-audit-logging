import type { AuditLogEvent } from "shared-types"

export default (event: AuditLogEvent): boolean => event.eventCode === "exceptions.generated"
