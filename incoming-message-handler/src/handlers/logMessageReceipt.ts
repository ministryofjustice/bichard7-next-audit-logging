import { isError, AuditLog, AuditLogDynamoGateway } from "shared"
import { createDynamoDbConfig } from "src/configs"
import PersistMessageUseCase from "src/use-cases/PersistMessageUseCase"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const persistMessage = new PersistMessageUseCase(auditLogGateway)

export default async function logMessageReceipt(event: AuditLog): Promise<AuditLog> {
  const persistMessageResult = await persistMessage.persist(event)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  return event
}
