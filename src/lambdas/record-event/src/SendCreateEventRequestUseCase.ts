import type { PromiseResult, AuditLogEvent } from "shared"
import AuditLogApiGateway from "./AuditLogApiGateway"

export default class SendCreateEventRequestUseCase {
  constructor(private readonly api: AuditLogApiGateway) {}

  execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return this.api.createAuditLogEvent(messageId, event)
  }
}
