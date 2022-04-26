process.env.API_URL = "http://localhost:3010"
process.env.API_KEY = "apiKey"
process.env.DB_HOST = "localhost"
process.env.DB_USER = "bichard"
process.env.DB_PASSWORD = "password"
process.env.DB_NAME = "bichard"

import { Client } from "pg"
import { AuditLogApiClient, TestDynamoGateway } from "shared"
import type { ApiClient, AuditLog } from "shared-types"
import { isSuccess } from "shared-types"
import { execute } from "lambda-local"
import doRecordErrorArchival from "."

describe("Record Error Archival e2e", () => {
  let pg: Client
  let api: ApiClient

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

    await pg.query(`DROP SCHEMA IF EXISTS br7own CASCADE`)

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
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, '2022-04-26T12:53:55.000Z', 'me', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES (1, 'message_1', 1)`
    )

    const testDynamoGateway = new TestDynamoGateway({
      DYNAMO_URL: "http://localhost:8000",
      DYNAMO_REGION: "eu-west-2",
      TABLE_NAME: "auditLogTable",
      AWS_ACCESS_KEY_ID: "DUMMY",
      AWS_SECRET_ACCESS_KEY: "DUMMY"
    })
    await testDynamoGateway.deleteAll("auditLogTable", "messageId")

    api = new AuditLogApiClient("http://localhost:3010", "apiKey")
    await api.createAuditLog({
      messageId: "message_1",
      receivedDate: new Date().toISOString(),
      events: [],
      caseId: "message_1",
      externalCorrelationId: "message_1",
      createdBy: "record-error-archival e2e tests",
      messageHash: "message_1"
    } as unknown as AuditLog)
  })

  afterAll(async () => {
    await pg.end()
  })

  it("should archive record errors successfully", async () => {
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

    await execute({
      event: {},
      lambdaFunc: { handler: doRecordErrorArchival },
      region: "eu-west-2",
      timeoutMs: 120 * 1_000,
      environment: {
        API_URL: "http://localhost:3010",
        API_KEY: "apiKey",
        DB_HOST: "localhost",
        DB_USER: "bichard",
        DB_PASSWORD: "password",
        DB_NAME: "bichard"
      }
    })

    const messageResult = await api.getMessage("message_1")
    expect(isSuccess(messageResult)).toBeTruthy()
    const message = messageResult as AuditLog

    // Check audit log results
    expect(message.events).toHaveLength(1)
    expect(message.events[0]).toStrictEqual({
      eventSource: "me",
      attributes: { "Error ID": 1 },
      eventType: "Error archival",
      category: "information",
      timestamp: "2022-04-26T12:53:55.000Z"
    })

    // Check postgres results
    const recordQueryResult = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id = 1`
    )
    expect(recordQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
    expect(recordQueryResult.rows[0].audit_log_attempts).toBe(1)
    const groupQueryResult = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id = 1`)
    expect(groupQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
  })
})
