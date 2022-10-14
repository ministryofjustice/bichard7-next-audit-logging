import type { PromiseResult } from "shared-types"
import type { AuditLogLookupDynamoGateway } from "../gateways/dynamo"

export default class DeleteAuditLogLookupItemsUseCase {
  constructor(private readonly awsAuditLogLookupDynamoGateway: AuditLogLookupDynamoGateway) {}

  call(messageId: string): PromiseResult<void> {
    return this.awsAuditLogLookupDynamoGateway.deleteByMessageId(messageId)
  }
}
