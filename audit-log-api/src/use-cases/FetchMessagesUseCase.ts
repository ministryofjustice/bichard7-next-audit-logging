import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"

export default class FetchMessagesUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  get(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchMany()
  }
}
