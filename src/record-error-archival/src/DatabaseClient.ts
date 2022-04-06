import { Client } from "pg"

export type ArchivedErrorRecord = {
  messageId: string
  errorId: bigint
  archivedAt: Date
  archivedBy: string
  archiveLogId: bigint
}

export default class DatabaseClient {
  private host: string

  private user: string

  private password: string

  private database: string

  private schema: string

  private postgres: Client

  constructor(host: string, user: string, password: string, database: string, schema: string) {
    this.host = host
    this.user = user
    this.password = password
    this.database = database
    this.schema = schema

    this.postgres = new Client({
      database: this.database,
      user: this.user,
      password: this.password,
      host: this.host
    })
  }

  async connect() {
    await this.postgres.connect()
  }

  async disconnect() {
    await this.postgres.end()
  }

  async fetchUnloggedArchivedErrors(): Promise<ArchivedErrorRecord[]> {
    const errors: ArchivedErrorRecord[] = await this.postgres
      .query(
        `SELECT message_id, error_id, archived_at, archived_by, archive_log_id
        FROM ${this.schema}.archive_error_list ael
        INNER JOIN ${this.schema}.archive_log al ON (ael.archive_log_id = al.log_id)
        WHERE audit_logged_at IS NULL`
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

  async markArchiveAuditLogged(archiveLogId: bigint) {
    await this.postgres.query(
      `UPDATE ${this.schema}.archive_log
       SET audit_logged_at = NOW()
       WHERE log_id = $1`,
      [archiveLogId]
    )
  }
}
