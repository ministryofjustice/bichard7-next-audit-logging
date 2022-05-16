import { addDays, addMonths } from "date-fns"
import type { Client } from "pg"
import { logger } from "shared"
import type { ApiClient, AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"

const rescheduleSanitiseCheck = (dynamo: AuditLogDynamoGateway, message: AuditLog): PromiseResult<void> => {
  // TODO: Make time between sanitiseChecks configurable
  return dynamo.updateSanitiseCheck(message.messageId, addDays(new Date(), 2))
}

const shouldSanitise = async (db: Client, message: AuditLog): PromiseResult<{ sanitise: boolean; error: boolean }> => {
  // Only sanitise messages more than 3 months old
  if (addMonths(new Date(message.receivedDate), 3) > new Date()) {
    return { sanitise: false, error: false }
  }

  try {
    const archiveTableResult = await db.query(
      `SELECT 1
      FROM br7own.archive_error_list
      WHERE message_id = $1`,
      [message.messageId]
    )
    if (archiveTableResult.rowCount > 0) {
      return { sanitise: true, error: false }
    }

    const unarchivedTableResult = await db.query(
      `SELECT 1
      FROM br7own.error_list
      WHERE message_id = $1`,
      [message.messageId]
    )
    if (unarchivedTableResult.rowCount > 0) {
      return { sanitise: false, error: false }
    }
  } catch (e) {
    logger.error({
      message: "Unable to check if message is sanitised",
      error: e,
      messageId: message.messageId
    })
    return { sanitise: false, error: true }
  }

  return { sanitise: true, error: false }
}

const fetchOldMessages = (dynamo: AuditLogDynamoGateway): PromiseResult<AuditLog[]> => dynamo.fetchUnsanitised(500)

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
    const shouldSanitiseResult = await shouldSanitise(db, message)
    if (isError(shouldSanitiseResult) || shouldSanitiseResult.error) {
      logger.error({
        message: "Unable to check if message is sanitised",
        error: shouldSanitiseResult,
        messageId: message.messageId
      })
    } else if (shouldSanitiseResult.sanitise as boolean) {
      const sanitiseResult = await api.sanitiseMessage(message.messageId)
      if (isError(sanitiseResult)) {
        logger.error({ message: "Unable to sanitise message", error: sanitiseResult, messageId: message.messageId })
      }
    }

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
