/* eslint-disable @typescript-eslint/no-explicit-any */

jest.setTimeout(30_000)

import { addDays } from "date-fns"
import { execute } from "lambda-local"
import { Client } from "pg"
import { AuditLogApiClient, logger, TestDynamoGateway } from "shared"
import "shared-testing"
import type { ApiClient, KeyValuePair } from "shared-types"
import { AuditLog } from "shared-types"
import sanitiseOldMessages from "./index"

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

// Produces the string "($1), ($2), ($3), ..." for the given range
const sqlPlaceholderForRange = (range: number) => [...Array(range).keys()].map((x) => `($${x + 1})`).join(", ")

const insertDbRecords = async (
  db: Client,
  unarchivedRecordIds: string[],
  archivedRecordIds: string[]
): Promise<void> => {
  if (unarchivedRecordIds.length > 0) {
    await db.query(
      `INSERT INTO br7own.error_list (message_id) VALUES ${sqlPlaceholderForRange(unarchivedRecordIds.length)};`,
      unarchivedRecordIds
    )
  }
  if (archivedRecordIds.length > 0) {
    await db.query(
      `INSERT INTO br7own.archive_error_list (message_id) VALUES ${sqlPlaceholderForRange(archivedRecordIds.length)};`,
      archivedRecordIds
    )
  }
}

// Returns a mapping of externalCorrelationId => messageId
const insertAuditLogRecords = async (
  gateway: TestDynamoGateway,
  records: { externalCorrelationId: string; receivedAt: Date }[]
): Promise<KeyValuePair<string, string>> => {
  const messageIds: KeyValuePair<string, string> = {}

  for (const record of records) {
    const auditLog = new AuditLog(record.externalCorrelationId, record.receivedAt, record.externalCorrelationId)
    await gateway.insertOne(auditLogTableName, auditLog, record.externalCorrelationId)
    messageIds[record.externalCorrelationId] = auditLog.messageId
  }

  return messageIds
}

const lambdaEnvironment = {
  API_URL: "http://localhost:3010",
  API_KEY: "apiKey",
  DB_HOST: "localhost",
  DB_PORT: 5432,
  DB_USER: "bichard",
  DB_PASSWORD: "password",
  DB_NAME: "bichard",
  DB_SCHEMA: "br7own",
  DB_SSL: false,
  AWS_URL: "http://localhost:8000",
  AWS_REGION: "eu-west-2",
  AUDIT_LOG_TABLE_NAME: "auditLogTable",
  DYNAMO_AWS_ACCESS_KEY_ID: "dummy1",
  DYNAMO_AWS_SECRET_ACCESS_KEY: "dummy2"
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

    api = new AuditLogApiClient(lambdaEnvironment.API_URL, lambdaEnvironment.API_KEY)
  })

  beforeEach(async () => {
    await db.query(`DROP SCHEMA IF EXISTS br7own CASCADE`)
    await db.query(createTableSql)

    await gateway.deleteAll("auditLogTable", "messageId")
  })

  afterAll(async () => {
    await db.end()
  })

  it("should sanitise a single message older than the configured threshold which has been archived", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])
    await insertDbRecords(db, [], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeTruthy()
  })

  it("shouldn't sanitise a single message older than the configured threshold which is unarchived", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])
    await insertDbRecords(db, [messageIds.message_1], [])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("should sanitise a single message older than the configured threshold which isn't in the database", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeTruthy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which has been archived", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date() }
    ])
    await insertDbRecords(db, [], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which is unarchived", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date() }
    ])
    await insertDbRecords(db, [messageIds.message_1], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which isn't in the database", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date() }
    ])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1)

    expect(messageResult).toNotBeError()
    const message = messageResult as AuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it.only("should update the nextSanitiseCheck date of messages we don't sanitise", async () => {
    const messageIds = await insertAuditLogRecords(gateway, [
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") },
      { externalCorrelationId: "message_2", receivedAt: new Date("2022-01-02T09:00:00") },
      { externalCorrelationId: "message_3", receivedAt: new Date("2022-01-03T09:00:00") },
      { externalCorrelationId: "message_4", receivedAt: new Date("2022-01-04T09:00:00") },
      { externalCorrelationId: "message_5", receivedAt: new Date("2022-01-05T09:00:00") },
      { externalCorrelationId: "message_6", receivedAt: new Date() },
      { externalCorrelationId: "message_7", receivedAt: new Date() }
    ])
    await insertDbRecords(
      db,
      [messageIds.message_1, messageIds.message_2, messageIds.message_3, messageIds.message_6],
      [messageIds.message_4, messageIds.message_5, messageIds.message_7]
    )

    await executeLambda()

    for (const messageId of Object.values(messageIds)) {
      const messageResult = await api.getMessage(messageId)
      expect(messageResult).toNotBeError()

      const message = messageResult as AuditLog
      const expectedNextCheck = message.isSanitised ? message.receivedDate : addDays(new Date(), 2).toISOString()
      expect(message.nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
    }
  })
})