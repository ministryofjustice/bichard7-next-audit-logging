import { add } from "date-fns"
import type { Client } from "pg"
import { logger } from "shared"
import type { ApiClient, AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { SanitiseOldMessagesConfig } from "./config"

export default class SanitiseOldMessages {
  constructor(
    private api: ApiClient,
    private dynamo: AuditLogDynamoGateway,
    private db: Client,
    private config: SanitiseOldMessagesConfig
  ) {
    this.api = api
    this.dynamo = dynamo
    this.db = db
    this.config = config
  }

  public async sanitiseOldMessages() {
    logger.debug("Fetching messages to sanitise")

    // Fetch messages over the configured age threshold from dynamo
    const messages = await this.dynamo.fetchUnsanitised(this.config.MESSAGE_FETCH_BATCH_NUM)
    if (isError(messages)) {
      logger.error({ message: "Unable to fetch messages from dynamo, exiting", error: messages })
      return
    }

    // Call postgres and check if we should sanitise each message
    for (const message of messages) {
      const shouldSanitiseResult = await this.shouldSanitise(message, this.config.SANITISE_AFTER)
      if (isError(shouldSanitiseResult) || shouldSanitiseResult.error) {
        logger.error({
          message: "Unable to check if message is sanitised",
          error: shouldSanitiseResult,
          messageId: message.messageId
        })
        continue
      } else if (shouldSanitiseResult.sanitise) {
        const sanitiseResult = await this.api.sanitiseMessage(message.messageId)
        if (isError(sanitiseResult)) {
          logger.error({ message: "Unable to sanitise message", error: sanitiseResult, messageId: message.messageId })
        }
      }

      const rescheduleSanitiseCheckResult = await this.rescheduleSanitiseCheck(message, this.config.CHECK_FREQUENCY)
      if (isError(rescheduleSanitiseCheckResult)) {
        logger.error({
          message: "Unable to reschedule sanitise check",
          error: rescheduleSanitiseCheckResult,
          messageId: message.messageId
        })
      }
    }
  }

  private async shouldSanitise(
    message: AuditLog,
    ageThreshold: Duration
  ): PromiseResult<{ sanitise: boolean; error: boolean }> {
    // Only sanitise messages more than 3 months old
    if (add(new Date(message.receivedDate), ageThreshold) > new Date()) {
      return { sanitise: false, error: false }
    }

    try {
      const archiveTableResult = await this.db.query(
        `SELECT 1
        FROM br7own.archive_error_list
        WHERE message_id = $1`,
        [message.messageId]
      )
      if (archiveTableResult.rowCount > 0) {
        return { sanitise: true, error: false }
      }

      const unarchivedTableResult = await this.db.query(
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

  private rescheduleSanitiseCheck(message: AuditLog, frequency: Duration) {
    return this.dynamo.updateSanitiseCheck(message.messageId, add(new Date(), frequency))
  }
}
