import { PromiseResult } from "shared"
import AuditLogApiGateway from "src/gateways/AuditLogApiGateway"
import { AuditLogEvent } from "src/types"

export default class SendCreateEventRequestUseCase {
  private readonly gateway: AuditLogApiGateway

  constructor(apiUrl: string) {
    this.gateway = new AuditLogApiGateway(apiUrl)
  }

  execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return this.gateway.createAuditLogEvent(messageId, event)
  }
}
