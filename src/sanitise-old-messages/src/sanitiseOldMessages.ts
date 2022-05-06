import type { Client } from "pg"
import { AuditLogApiClient, logger } from "shared"
import type { AuditLogDynamoGateway } from "shared-types"

export default async (api: AuditLogApiClient, dynamo: AuditLogDynamoGateway, db: Client): Promise<void> => {
  logger.debug("Fetching messages to sanitise")

  // Fetch old messages (over 3 months) from dynamo
  // Call postgres and check if we should sanitise each message
  // If yes, call sanitise endpoint on api for message

  await Promise.resolve()
  return Promise.resolve()
}
