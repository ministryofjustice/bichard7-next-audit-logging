import CalculateMessageStatusUseCase from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import { type DynamoAuditLog, type DynamoAuditLogEvent } from "src/shared/types"

export default (auditLog: DynamoAuditLog, allEvents: DynamoAuditLogEvent[]): Partial<DynamoAuditLog> => {
  return new CalculateMessageStatusUseCase(auditLog.status, allEvents).call()
}
