import { Client } from "pg"
import { logger } from "shared"
import type { PromiseResult } from "shared-types"

export type ArchivedErrorRecord = {
  messageId: string
  errorId: number
  archivedAt: Date
  archivedBy: string
  archiveLogId: number
}

export type DatabaseRow = {
  message_id: string
  error_id: number
  archived_at: string
  archived_by: string
  archive_log_id: number
}

// Produces the string "$1, $2, $3..." for the given range
const wherePlaceholderForRange = (range: number) => [...Array(range).keys()].map((x) => `$${x + 1}`).join(", ")

export default class DatabaseClient {
  private postgres: Client

  constructor(
    private host: string,
    private user: string,
    private password: string,
    private useSsl: boolean,
    private database: string,
    private schema: string,
    private archiveGroupLimit: number
  ) {
    this.postgres = new Client({
      host: this.host,
      user: this.user,
      password: this.password,
      ssl: this.useSsl,
      database: this.database
    })
  }

  async connect() {
    await this.postgres.connect()
  }

  async disconnect() {
    await this.postgres.end()
  }

  fetchUnloggedArchivedErrors(): PromiseResult<ArchivedErrorRecord[]> {
    logger.debug("Fetching unlogged archived errors")

    return this.postgres
      .query(
        `SELECT message_id, error_id, archived_at, archived_by, archive_log_id
        FROM ${this.schema}.archive_error_list ael
        INNER JOIN (
            SELECT archived_at, archived_by, log_id
            FROM ${this.schema}.archive_log
            WHERE audit_logged_at IS NULL LIMIT $1)
          al ON (ael.archive_log_id = al.log_id)
        WHERE audit_logged_at IS NULL`,
        [this.archiveGroupLimit]
      )
      .then((res) =>
        res.rows.map(
          (row: DatabaseRow) =>
            <ArchivedErrorRecord>{
              messageId: row.message_id,
              errorId: row.error_id,
              archivedAt: new Date(row.archived_at),
              archivedBy: row.archived_by,
              archiveLogId: row.archive_log_id
            }
        )
      )
      .catch((error) => error)
  }

  markArchiveGroupAuditLogged(archiveLogGroupId: number): PromiseResult<void> {
    logger.debug(`Marking log group ${archiveLogGroupId} as audit logged`)

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_log
        SET audit_logged_at = NOW()
        WHERE log_id = $1`,
        [archiveLogGroupId]
      )
      .catch((error) => error)
  }

  markErrorsAuditLogged(errorIds: number[]): PromiseResult<void> {
    logger.debug({ message: "Marking errors as audit logged", errorIds: errorIds })

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_error_list
        SET audit_logged_at = NOW(), audit_log_attempts = audit_log_attempts + 1
        WHERE error_id IN (${wherePlaceholderForRange(errorIds.length)})`,
        errorIds
      )
      .catch((error) => error)
  }

  markErrorsAuditLogFailed(errorIds: number[]): PromiseResult<void> {
    logger.debug({ message: "Recording failure to audit log errors", errorIds: errorIds })

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_error_list
        SET audit_log_attempts = audit_log_attempts + 1
        WHERE error_id IN (${wherePlaceholderForRange(errorIds.length)})`,
        errorIds
      )
      .catch((error) => error)
  }
}
