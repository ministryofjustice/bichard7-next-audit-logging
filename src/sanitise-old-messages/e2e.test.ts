/* eslint-disable @typescript-eslint/no-explicit-any */
jest.setTimeout(30_000)

import { addDays } from "date-fns"
import { execute } from "lambda-local"
import { Client } from "pg"
import { AuditLogApiClient, logger } from "src/shared"
import "src/shared/testing"
import { clearDynamoTable, createMockAuditLog, setEnvironmentVariables } from "src/shared/testing"
import { ApiClient, isError, KeyValuePair, OutputApiAuditLog } from "src/shared/types"
import sanitiseOldMessages from "./index"

setEnvironmentVariables({
  SANITISE_AFTER_DAYS: "90",
  CHECK_FREQUENCY_DAYS: "2"
})

logger.level = "debug"

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
  records: { externalCorrelationId: string; receivedAt: Date }[]
): Promise<KeyValuePair<string, string>> => {
  const messageIds: KeyValuePair<string, string> = {}

  for (const record of records) {
    const auditLog = await createMockAuditLog({
      externalCorrelationId: record.externalCorrelationId,
      receivedDate: record.receivedAt.toISOString(),
      messageId: record.externalCorrelationId
    })
    if (isError(auditLog)) {
      throw auditLog
    }
    messageIds[record.externalCorrelationId] = auditLog.messageId
  }

  return messageIds
}

const executeLambda = (environment?: any): Promise<unknown> => {
  return execute({
    event: {},
    lambdaFunc: { handler: sanitiseOldMessages },
    region: "eu-west-2",
    timeoutMs: 60 * 1_000,
    environment: environment ?? process.env
  })
}

describe("Sanitise Old Messages e2e", () => {
  let api: ApiClient
  let db: Client

  beforeAll(async () => {
    db = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT!, 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL != "false",
      database: process.env.DB_NAME
    })
    await db.connect()

    api = new AuditLogApiClient(process.env.API_URL!, process.env.API_KEY!)
  })

  beforeEach(async () => {
    await db.query(`TRUNCATE TABLE br7own.error_list`)
    await db.query(`TRUNCATE TABLE br7own.archive_error_list CASCADE`)
    await db.query(`DELETE FROM br7own.archive_log`)

    await clearDynamoTable("auditLogTable", "messageId")
  })

  afterAll(async () => {
    await db.end()
  })

  it("should sanitise a single message older than the configured threshold which has been archived", async () => {
    const messageIds = await insertAuditLogRecords([
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])
    await insertDbRecords(db, [], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeTruthy()
  })

  it("shouldn't sanitise a single message older than the configured threshold which is unarchived", async () => {
    const messageIds = await insertAuditLogRecords([
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])
    await insertDbRecords(db, [messageIds.message_1], [])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("should sanitise a single message older than the configured threshold which isn't in the database", async () => {
    const messageIds = await insertAuditLogRecords([
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-01T09:00:00") }
    ])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeTruthy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which has been archived", async () => {
    const messageIds = await insertAuditLogRecords([{ externalCorrelationId: "message_1", receivedAt: new Date() }])
    await insertDbRecords(db, [], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which is unarchived", async () => {
    const messageIds = await insertAuditLogRecords([{ externalCorrelationId: "message_1", receivedAt: new Date() }])
    await insertDbRecords(db, [messageIds.message_1], [messageIds.message_1])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("shouldn't sanitise a single message newer than the configured threshold which isn't in the database", async () => {
    const messageIds = await insertAuditLogRecords([{ externalCorrelationId: "message_1", receivedAt: new Date() }])

    await executeLambda()

    const messageResult = await api.getMessage(messageIds.message_1, { includeColumns: ["isSanitised"] })

    expect(messageResult).toNotBeError()
    const message = messageResult as OutputApiAuditLog
    expect(message.isSanitised).toBeFalsy()
  })

  it("should schedule the nextSanitiseCheck date of every message we check for 2 days time", async () => {
    const messageIds = await insertAuditLogRecords([
      { externalCorrelationId: "message_0", receivedAt: new Date("2022-01-01T09:00:00") },
      { externalCorrelationId: "message_1", receivedAt: new Date("2022-01-02T09:00:00") },
      { externalCorrelationId: "message_2", receivedAt: new Date("2022-01-03T09:00:00") },
      { externalCorrelationId: "message_3", receivedAt: new Date("2022-01-04T09:00:00") },
      { externalCorrelationId: "message_4", receivedAt: new Date("2022-01-05T09:00:00") },
      { externalCorrelationId: "message_5", receivedAt: new Date() },
      { externalCorrelationId: "message_6", receivedAt: new Date() }
    ])
    await insertDbRecords(
      db,
      [messageIds.message_0, messageIds.message_1, messageIds.message_2, messageIds.message_5],
      [messageIds.message_3, messageIds.message_4, messageIds.message_6]
    )

    await executeLambda()

    const messages: OutputApiAuditLog[] = []
    for (const messageId of Object.values(messageIds)) {
      const messageResult = await api.getMessage(messageId, { includeColumns: ["isSanitised", "nextSanitiseCheck"] })
      expect(messageResult).toNotBeError()

      messages.push(messageResult as OutputApiAuditLog)
    }

    const expectedNextCheck = addDays(new Date(), 2).toISOString()

    expect(messages[0].nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
    expect(messages[1].nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
    expect(messages[2].nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
    expect(messages[3].nextSanitiseCheck).toBeFalsy()
    expect(messages[4].nextSanitiseCheck).toBeFalsy()
    expect(messages[5].nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
    expect(messages[6].nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
  })
})
