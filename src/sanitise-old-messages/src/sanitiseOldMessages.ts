import type { Client } from "pg"
import { logger } from "shared"
import type { ApiClient, AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"

const isArchived = async (db: Client, messageId: string): PromiseResult<boolean> => {}

const fetchOldMessages = async (dynamo: AuditLogDynamoGateway): PromiseResult<AuditLog[]> => {}

export default async (api: ApiClient, dynamo: AuditLogDynamoGateway, db: Client): Promise<void> => {
  logger.debug("Fetching messages to sanitise")

  // Fetch old messages (over 3 months) from dynamo
  const messages = await fetchOldMessages(dynamo)
  if (isError(messages)) {
    logger.error({ message: "Unable to fetch messages from dynamo, exiting", error: messages })
    return
  }

  // Call postgres and check if we should sanitise each message
  for (const message of messages) {
    // If yes, call sanitise endpoint on api for message
    if (await isArchived(db, message.messageId)) {
      await api.sanitiseMessage(message.messageId)
    }
  }
}
