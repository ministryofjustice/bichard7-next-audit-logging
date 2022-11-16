import CalculateMessageStatusUseCase from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import type { AuditLog, AuditLogEvent } from "src/shared/types"

export default (allEvents: AuditLogEvent[]): Partial<AuditLog> => {
  return new CalculateMessageStatusUseCase(allEvents).call()
}
