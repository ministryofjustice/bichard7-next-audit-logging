import type { ApiAuditLogEvent } from "src/shared/types"

export default (event: ApiAuditLogEvent): boolean => event.eventCode === "exceptions.generated"
