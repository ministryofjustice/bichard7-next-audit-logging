import { Client } from "pg"
import { logger } from "shared"

export type ArchivedErrorRecord = {
  messageId: string
  errorId: number
  archivedAt: Date
  archivedBy: string
  archiveLogId: number
}

// Produces the string "$1, $2, $3..." for the given range
const wherePlaceholderForRange = (range: number) => [...Array(range).keys()].map((x) => `$${x + 1}`).join(", ")

export default class DatabaseClient {
  private host: string

  private user: string

  private password: string

  private database: string

  private useSsl: boolean

  private schema: string

  private postgres: Client

  private archiveGroupLimit: number

  constructor(
    host: string,
    user: string,
    password: string,
    useSsl: boolean,
    database: string,
    schema: string,
    archiveGroupLimit: number
  ) {
    this.host = host
    this.user = user
    this.password = password
    this.useSsl = useSsl
    this.database = database
    this.schema = schema
    this.archiveGroupLimit = archiveGroupLimit

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

  async fetchUnloggedArchivedErrors(): Promise<ArchivedErrorRecord[]> {
    logger.debug("Fetching unlogged archived errors")

    const errors: ArchivedErrorRecord[] = await this.postgres
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
          (row) =>
            <ArchivedErrorRecord>{
              messageId: row.message_id,
              errorId: row.error_id,
              archivedAt: new Date(row.archived_at),
              archivedBy: row.archived_by,
              archiveLogId: row.archive_log_id
            }
        )
      )

    return errors
  }

  async markArchiveGroupAuditLogged(archiveLogGroupId: number) {
    logger.debug(`Marking log group ${archiveLogGroupId} as audit logged`)

    await this.postgres.query(
      `UPDATE ${this.schema}.archive_log
       SET audit_logged_at = NOW()
       WHERE log_id = $1`,
      [archiveLogGroupId]
    )
  }

  async markErrorsAuditLogged(errorIds: number[]) {
    logger.debug({ message: "Marking errors as audit logged", errorIds: errorIds })

    await this.postgres.query(
      `UPDATE ${this.schema}.archive_error_list
       SET audit_logged_at = NOW(), audit_log_attempts = audit_log_attempts + 1
       WHERE error_id IN (${wherePlaceholderForRange(errorIds.length)})`,
      errorIds
    )
  }

  async markErrorsAuditLogFailed(errorIds: number[]) {
    logger.debug({ message: "Recording failure to audit log errors", errorIds: errorIds })

    await this.postgres.query(
      `UPDATE ${this.schema}.archive_error_list
       SET audit_log_attempts = audit_log_attempts + 1
       WHERE error_id IN (${wherePlaceholderForRange(errorIds.length)})`,
      errorIds
    )
  }
}
