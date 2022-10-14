import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"

const getMessageById = async (
  gateway: AuditLogDynamoGateway,
  messageId?: string
): PromiseResult<AuditLog | undefined> => {
  if (!messageId) {
    return undefined
  }

  const message = await gateway.fetchOne(messageId, { includeColumns: ["isSanitised", "nextSanitiseCheck"] })

  if (isError(message)) {
    return message
  }

  return message
}

export default getMessageById
