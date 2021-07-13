import { isError } from "shared"
import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared"

const getMessageById = async (
  gateway: AuditLogDynamoGateway,
  messageId?: string
): PromiseResult<AuditLog | undefined> => {
  if (!messageId) {
    return undefined
  }
  const message = await gateway.fetchOne(messageId)

  if (isError(message)) {
    return message
  }

  return message
}

export default getMessageById
