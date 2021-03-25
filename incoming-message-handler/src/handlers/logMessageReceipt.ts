import { isError, AuditLog, AuditLogDynamoGateway } from "shared"
import { createDynamoDbConfig } from "src/configs"
import PersistMessageUseCase from "src/use-cases/PersistMessageUseCase"

const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "AuditLog")
const persistMessage = new PersistMessageUseCase(auditLogGateway)

export default async function logMessageReceipt(event: AuditLog): Promise<AuditLog> {
  const persistMessageResult = await persistMessage.persist(event)

  if (isError(persistMessageResult)) {
    throw persistMessageResult
  }

  return event
}
