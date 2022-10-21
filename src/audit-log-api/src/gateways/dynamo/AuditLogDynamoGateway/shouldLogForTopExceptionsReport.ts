import type { AuditLogEvent } from "shared-types"

export default (event: AuditLogEvent): boolean => event.attributes.eventCode === "exceptions.generated"
