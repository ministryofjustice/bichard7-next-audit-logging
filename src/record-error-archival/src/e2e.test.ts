import { Client } from "pg"

describe("Record Error Archival e2e", () => {
  let pg: Client

  beforeAll(async () => {
    pg = new Client({
      host: "localhost",
      port: 5432,
      user: "bichard",
      password: "password",
      ssl: false,
      database: "bichard"
    })

    pg.connect()

    await pg.query(`DROP SCHEMA br7own CASCADE`)

    const createTableSql = `
    CREATE SCHEMA br7own;
    GRANT ALL ON SCHEMA br7own TO bichard;
    CREATE TABLE br7own.archive_log
    (
        log_id          SERIAL PRIMARY KEY,
        archived_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        archived_by     TEXT,
        audit_logged_at TIMESTAMP
    );
    
    CREATE TABLE br7own.archive_error_list
    (
        error_id                INTEGER PRIMARY KEY,
        message_id              VARCHAR(70)   NOT NULL,
        archive_log_id          INTEGER REFERENCES br7own.archive_log (log_id) ON DELETE CASCADE,
        audit_logged_at         TIMESTAMP DEFAULT NULL,
        audit_log_attempts      INTEGER NOT NULL DEFAULT 0
    );
    `

    await pg.query(createTableSql)
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, now(), 'me', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES (1, 'message_1', 1)`
    )
  })

  afterAll(async () => {
    await pg.end()
  })

  it("should archive record errors successfully", () => {
    /*
      Connect to postgres
      Ensure database is clear
      Put new schema in

      Connect to audit log

      Put in any data this test needs
      Invoke lambda

      Connect to audit log
      Ensure correct data in audit log
      Ensure correct data in postgres
      Ensure any metrics are published
    */

    expect(true).toBeTruthy()
  })
})
