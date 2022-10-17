import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"

const getMessageById = async (
  gateway: AuditLogDynamoGatewayInterface,
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
