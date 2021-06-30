import { PromiseResult, AuditLog, AuditLogDynamoGateway, AuditLogStatus } from "shared"

export default class FetchMessagesUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  get(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchMany()
  }

  getById(messageId: string): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(messageId)
  }

  getByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
    return this.gateway.fetchByExternalCorrelationId(externalCorrelationId)
  }

  getByStatus(status: AuditLogStatus): PromiseResult<AuditLog[]> {
    return this.gateway.fetchByStatus(status)
  }
}
