import groupBy from "lodash.groupby"
import type { QueryResult } from "pg"
import { Client } from "pg"
import { logger } from "src/shared"
import type { KeyValuePair, PromiseResult } from "src/shared/types"

export type BichardRecord = {
  messageId: string
  recordId: number
  archivedAt: Date
  archivedBy: string
  groupId: number
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

export class DatabaseClient {
  private postgres: Client

  constructor(
    private host: string,
    private port: number,
    private user: string,
    private password: string,
    private useSsl: boolean,
    private database: string,
    private schema: string,
    private archiveGroupLimit: number
  ) {
    this.postgres = new Client({
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      ssl: this.useSsl
        ? {
            rejectUnauthorized: false
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

  async fetchUnloggedBichardRecords(): PromiseResult<KeyValuePair<number, BichardRecord[]>> {
    let res: QueryResult<DatabaseRow>

    logger.debug("Fetching unlogged archived records")
    try {
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
    const rows: BichardRecord[] = res.rows.map(
      (row: DatabaseRow) =>
        <BichardRecord>{
          messageId: row.message_id,
          recordId: row.error_id,
          archivedAt: new Date(row.archived_at + " UTC"),
          archivedBy: row.archived_by,
          groupId: row.archive_log_id
        }
    )

    return groupBy(rows, (row) => row.groupId)
  }

  markBichardRecordGroupAuditLogged(groupId: number): PromiseResult<void> {
    logger.debug(`Marking log group ${groupId} as audit logged`)

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_log
        SET audit_logged_at = NOW()
        WHERE log_id = $1`,
        [groupId]
      )
      .catch((error) => error)
  }

  markBichardRecordsAuditLogged(recordIds: number[]): PromiseResult<void> {
    if (!recordIds.length) {
      return Promise.resolve()
    }

    logger.debug({ message: "Marking records as audit logged", recordIds: recordIds })

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_error_list
        SET audit_logged_at = NOW(), audit_log_attempts = audit_log_attempts + 1
        WHERE error_id IN (${wherePlaceholderForRange(recordIds.length)})`,
        recordIds
      )
      .catch((error) => error)
  }

  markBichardRecordsAuditLogFailed(recordIds: number[]): PromiseResult<void> {
    if (!recordIds.length) {
      return Promise.resolve()
    }

    logger.debug({ message: "Recording failure to audit log records", recordIds: recordIds })

    return this.postgres
      .query(
        `UPDATE ${this.schema}.archive_error_list
        SET audit_log_attempts = audit_log_attempts + 1
        WHERE error_id IN (${wherePlaceholderForRange(recordIds.length)})`,
        recordIds
      )
      .catch((error) => error)
  }

  // Mark any unmarked groups that should be as completed, i.e, where all their records are completed
  // This condition can occur after a previous failed update to mark the group as completed
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
