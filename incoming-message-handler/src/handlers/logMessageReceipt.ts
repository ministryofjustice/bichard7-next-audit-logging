import { isError } from "shared"
import { createDynamoDbConfig } from "src/configs"
import { AuditLog } from "src/entities"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
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
