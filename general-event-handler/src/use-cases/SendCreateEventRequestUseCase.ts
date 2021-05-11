import { PromiseResult } from "shared"
import ApiGateway from "src/gateways/ApiGateway"
import { AuditLogEvent } from "src/types"

export default class SendCreateEventRequestUseCase {
  private readonly gateway: ApiGateway

  constructor(apiUrl: string) {
    this.gateway = new ApiGateway(apiUrl)
  }

  execute(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return this.gateway.createAuditLogEvent(messageId, event)
  }
}
