import type { Client } from "pg"
import { logger } from "shared"
import type { ApiClient, AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import { subMonths } from "date-fns"

const shouldSanitise = async (db: Client, messageId: string): PromiseResult<boolean> => {
  // TODO error handling
  const archiveTableResult = await db.query(
    `SELECT 1
    FROM br7own.archive_error_list
    WHERE message_id = $1`,
    [messageId]
  )
  if (archiveTableResult.rowCount > 0) {
    return true
  }

  const unarchivedTableResult = await db.query(
    `SELECT 1
    FROM br7own.error_list
    WHERE message_id = $1`,
    [messageId]
  )
  if (unarchivedTableResult.rowCount > 0) {
    return false
  }

  return true
}

const fetchOldMessages = (dynamo: AuditLogDynamoGateway): PromiseResult<AuditLog[]> =>
  dynamo.fetchUnsanitisedBeforeDate(subMonths(new Date(), 3), 500)

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
    if (await shouldSanitise(db, message.messageId)) {
      await api.sanitiseMessage(message.messageId)
    }
  }
}
