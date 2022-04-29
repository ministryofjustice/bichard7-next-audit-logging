import groupBy from "lodash.groupby"
import type { QueryResult } from "pg"
import { Client } from "pg"
import { logger } from "shared"
import type { PromiseResult } from "shared-types"

export interface Dictionary<T> {
  [Key: number]: T
}

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
      ssl: this.useSsl
        ? {
            rejectUnauthorized: true
          }
        : false,
      database: this.database
    })
  }

  async connect() {
    await this.postgres.connect()
  }

  async disconnect() {
    await this.postgres.end()
  }

  async fetchUnloggedArchivedErrors(): PromiseResult<Dictionary<ArchivedErrorRecord[]>> {
    let res: QueryResult<DatabaseRow>

    try {
      logger.debug("Fetching unlogged archived errors")
      res = await this.postgres.query(
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
    } catch (e) {
      return e as Error
    }
    const rows: ArchivedErrorRecord[] = res.rows.map(
      (row: DatabaseRow) =>
        <ArchivedErrorRecord>{
          messageId: row.message_id,
          errorId: row.error_id,
          archivedAt: new Date(row.archived_at + " UTC"),
          archivedBy: row.archived_by,
          archiveLogId: row.archive_log_id
        }
    )

    return groupBy(rows, (row) => row.archiveLogId)
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
    if (!errorIds.length) {
      return Promise.resolve()
    }

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
    if (!errorIds.length) {
      return Promise.resolve()
    }

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

  // Mark any unmarked groups that should be as completed, i.e, where all their records are completed
  markUnmarkedGroupsCompleted(): PromiseResult<void> {
    return this.postgres
      .query(
        `UPDATE br7own.archive_log
        SET audit_logged_at = NOW()
        WHERE log_id IN (
          SELECT archive_log_id
          FROM br7own.archive_error_list
          WHERE archive_log_id IN
            (SELECT log_id
            FROM br7own.archive_log
            WHERE audit_logged_at IS NULL)
          GROUP BY archive_log_id
          HAVING every(audit_logged_at IS NOT NULL)
        )`
      )
      .catch((error) => error)
  }
}
