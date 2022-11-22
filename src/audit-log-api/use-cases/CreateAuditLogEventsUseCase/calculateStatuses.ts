import CalculateMessageStatusUseCase from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import type { DynamoAuditLog, DynamoAuditLogEvent } from "src/shared/types"

export default (allEvents: DynamoAuditLogEvent[]): Partial<DynamoAuditLog> => {
  return new CalculateMessageStatusUseCase(allEvents).call()
}
