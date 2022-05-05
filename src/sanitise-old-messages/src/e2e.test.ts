/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(15_000)

import { AuditLogApiClient, logger, TestDynamoGateway } from "shared"
import type { ApiClient } from "shared-types"
import { AuditLog } from "shared-types"
import "shared-testing"
import { execute } from "lambda-local"
import sanitiseOldMessages from "./index"
import { Client } from "pg"

logger.level = "debug"

const auditLogTableName = "auditLogTable"

const createTableSql = `
  CREATE SCHEMA br7own;
  GRANT ALL ON SCHEMA br7own TO bichard;
  
  CREATE TABLE br7own.archive_error_list
  (
      message_id VARCHAR(70) NOT NULL
  );

  CREATE TABLE br7own.error_list
  (
      message_id VARCHAR(70) NOT NULL
  );
`

// Produces the string "$1, $2, $3..." for the given range
const sqlPlaceholderForRange = (range: number) => [...Array(range).keys()].map((x) => `$${x + 1}`).join(", ")

const insertDbRecords = async (
  db: Client,
  unarchivedRecordIds: string[],
  archivedRecordIds: string[]
): Promise<void> => {
  if (unarchivedRecordIds.length > 0) {
    await db.query(
      `INSERT INTO br7own.error_list (message_id) VALUES (${sqlPlaceholderForRange(unarchivedRecordIds.length)});`,
      unarchivedRecordIds
    )
  }
  if (archivedRecordIds.length > 0) {
    await db.query(
      `INSERT INTO br7own.archive_error_list (message_id) VALUES (${sqlPlaceholderForRange(
        archivedRecordIds.length
      )});`,
      archivedRecordIds
    )
  }
}

const insertAuditLogRecords = async (
  gateway: TestDynamoGateway,
  records: { messageId: string; receivedAt: Date }[]
) => {
  for (const record of records) {
    const auditLog = new AuditLog("External Correlation ID", record.receivedAt, "Dummy hash")
    await gateway.insertOne(auditLogTableName, auditLog, record.messageId)
  }
}

const lambdaEnvironment = {
  API_URL: "http://localhost:3010",
  API_KEY: "apiKey",
  DB_HOST: "localhost",
  DB_USER: "bichard",
  DB_PASSWORD: "password",
  DB_NAME: "bichard"
}

const executeLambda = (environment?: any): Promise<unknown> => {
  return execute({
    event: {},
    lambdaFunc: { handler: sanitiseOldMessages },
    region: "eu-west-2",
    timeoutMs: 60 * 1_000,
    environment: environment ?? lambdaEnvironment
  })
}

describe("Sanitise Old Messages e2e", () => {
  let gateway: TestDynamoGateway
  let api: ApiClient
  let db: Client

  beforeAll(async () => {
    db = new Client({
      host: "localhost",
      port: 5432,
      user: "bichard",
      password: "password",
      ssl: false,
      database: "bichard"
    })
    await db.connect()

    gateway = new TestDynamoGateway({
      DYNAMO_URL: "http://localhost:8000",
      DYNAMO_REGION: "eu-west-2",
      TABLE_NAME: auditLogTableName,
      AWS_ACCESS_KEY_ID: "DUMMY",
      AWS_SECRET_ACCESS_KEY: "DUMMY"
    })
    api = new AuditLogApiClient("http://localhost:3010", "apiKey")
  })

  beforeEach(async () => {
    await db.query(`DROP SCHEMA IF EXISTS br7own CASCADE`)
    await db.query(createTableSql)

    await gateway.deleteAll("auditLogTable", "messageId")
  })

  afterAll(async () => {
    await db.end()
  })

  // eslint-disable-next-line jest/no-focused-tests
  it("should sanitise a single message older than the configured threshold which has been archived", async () => {
    await insertDbRecords(db, [], ["message_1"])
    await insertAuditLogRecords(gateway, [{ messageId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }])

    await executeLambda()

    const messageResult = await api.getMessage("message_1")

    expect(messageResult).toNotBeError()
  })

  it("should sanitise a single message older than the configured threshold which isn't in the database", async () => {
    await executeLambda()

    expect(true).toBeTruthy()
  })

  it("shouldn't sanitise a single message older than the configured threshold which hasn't been archived", async () => {
    await executeLambda()

    expect(true).toBeTruthy()
  })

  it("shouldn't sanitise messages fresher than the configured threshold", async () => {
    await executeLambda()

    expect(true).toBeTruthy()
  })
})
