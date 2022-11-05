import type { AuditLogEvent } from "src/shared/types"

export default (event: AuditLogEvent): boolean => event.eventCode === "exceptions.generated"
