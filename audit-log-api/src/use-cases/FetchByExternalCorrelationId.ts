import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchByExternalCorrelationId implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private externalCorrelationId: string) {}

  fetch(): PromiseResult<AuditLog | null> {
    return this.gateway.fetchByExternalCorrelationId(this.externalCorrelationId)
  }
}
