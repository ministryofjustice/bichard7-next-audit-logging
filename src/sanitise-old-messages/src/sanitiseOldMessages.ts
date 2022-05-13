import { addDays, subMonths } from "date-fns"
import type { Client } from "pg"
import { logger } from "shared"
import type { ApiClient, AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"

const rescheduleSanitiseCheck = (dynamo: AuditLogDynamoGateway, message: AuditLog): PromiseResult<AuditLog> => {
  // TODO: Incrementally increase reschedule date, double each time
  message.nextSanitiseCheck = addDays(new Date(), 2).toISOString()
  return dynamo.update(message)
}

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
    const shouldSanitiseResult = await shouldSanitise(db, message.messageId)
    if (isError(shouldSanitiseResult)) {
      logger.error({
        message: "Unable to check if message is sanitised",
        error: shouldSanitiseResult,
        messageId: message.messageId
      })
    } else if (shouldSanitiseResult as boolean) {
      const sanitiseResult = await api.sanitiseMessage(message.messageId)
      if (isError(sanitiseResult)) {
        logger.error({ message: "Unable to sanitise message", error: sanitiseResult, messageId: message.messageId })
      }
    }

    // Set next date to check if message should be sanitised
    const rescheduleSanitiseCheckResult = await rescheduleSanitiseCheck(dynamo, message)
    if (isError(rescheduleSanitiseCheckResult)) {
      logger.error({
        message: "Unable to reschedule sanitise check",
        error: rescheduleSanitiseCheckResult,
        messageId: message.messageId
      })
    }
  }
}
