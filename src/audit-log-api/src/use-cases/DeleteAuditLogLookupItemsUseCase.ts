import type { AuditLogLookupDynamoGateway, PromiseResult } from "shared-types"

export default class DeleteAuditLogLookupItemsUseCase {
  constructor(private readonly awsAuditLogLookupDynamoGateway: AuditLogLookupDynamoGateway) {}

  call(messageId: string): PromiseResult<void> {
    return this.awsAuditLogLookupDynamoGateway.deleteByMessageId(messageId)
  }
}
