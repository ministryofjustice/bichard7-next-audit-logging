import CalculateMessageStatusUseCase from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"

export default (allEvents: AuditLogEvent[]): Partial<DynamoAuditLog> => {
  return new CalculateMessageStatusUseCase(allEvents).call()
}
