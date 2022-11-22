/* eslint-disable @typescript-eslint/no-explicit-any */
jest.setTimeout(60_000)

import { execute } from "lambda-local"
import partition from "lodash.partition"
import { Client } from "pg"
import { AuditLogApiClient, logger } from "src/shared"
import { clearDynamoTable, createMockAuditLog, mockApiAuditLogEvent, mockInputApiAuditLog } from "src/shared/testing"
import type { ApiClient, InputApiAuditLog, OutputApiAuditLog } from "src/shared/types"
import { EventCode, isSuccess } from "src/shared/types"
import addArchivalEvents from "."

logger.level = "debug"

const lambdaEnvironment = {
  API_URL: "http://localhost:3010",
  API_KEY: "apiKey",
  DB_HOST: "localhost",
  DB_PORT: "5433",
  DB_USER: "bichard",
  DB_PASSWORD: "password",
  DB_NAME: "bichard"
}

const executeLambda = (environment?: any): Promise<unknown> =>
  execute({
    event: {},
    lambdaFunc: { handler: addArchivalEvents },
    region: "eu-west-2",
    timeoutMs: 120 * 1_000,
    environment: environment ?? lambdaEnvironment
  })

describe("Add Error Records e2e", () => {
  let pg: Client
  let api: ApiClient

  beforeAll(async () => {
    pg = new Client({
      host: "localhost",
      port: 5433,
      user: "bichard",
      password: "password",
      ssl: false,
      database: "bichard"
    })

    await pg.connect()

    api = new AuditLogApiClient("http://localhost:3010", "apiKey")
  })

  afterAll(async () => {
    await pg.end().catch((e) => console.error(e))
  })

  beforeEach(async () => {
    await pg.query(`TRUNCATE TABLE br7own.error_list`)
    await pg.query(`TRUNCATE TABLE br7own.archive_error_list CASCADE`)
    await pg.query(`DELETE FROM br7own.archive_log`)

    await clearDynamoTable("auditLogTable", "messageId", {
      endpoint: "http://localhost:8000",
      region: "eu-west-2",
      accessKeyId: "DUMMY",
      secretAccessKey: "DUMMY"
    })

    await clearDynamoTable("auditLogEventsTable", "_id", {
      endpoint: "http://localhost:8000",
      region: "eu-west-2",
      accessKeyId: "DUMMY",
      secretAccessKey: "DUMMY"
    })
  })

  it("should audit log single error records successfully", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, '2022-04-26T12:53:55.000Z', 'me', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES (1, 'message_1', 1)`
    )

    // Insert testdata into audit log
    await createMockAuditLog({ messageId: "message_1" })

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    const messageResult = await api.getMessage("message_1")
    expect(isSuccess(messageResult)).toBeTruthy()
    const message = messageResult as OutputApiAuditLog

    expect(message.events).toHaveLength(1)
    expect(message.events[0]).toStrictEqual({
      eventSource: "me",
      attributes: { "Record ID": 1 },
      eventCode: EventCode.ErrorRecordArchived,
      eventType: "Error record archival",
      category: "information",
      timestamp: "2022-04-26T12:53:55.000Z"
    })

    // Assert postgres results
    const recordQueryResult = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id = 1`
    )
    expect(recordQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
    expect(recordQueryResult.rows[0].audit_log_attempts).toBe(1)
    const groupQueryResult = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id = 1`)
    expect(groupQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
  })

  it("shouldn't duplicate audit log events for error records which are already audit logged", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, '2022-04-26T12:53:55.000Z', 'me', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES (1, 'message_1', 1)`
    )

    // Insert testdata into audit log
    await createMockAuditLog({ messageId: "message_1" })

    // Insert testdata into audit log
    const existingEvent = mockApiAuditLogEvent({
      eventSource: "me",
      category: "information",
      eventType: "Error record archival",
      timestamp: "2022-04-26T12:53:55.000Z",
      attributes: {
        "Record ID": 1
      }
    })
    await api.createEvent("message_1", existingEvent)

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    const messageResult = await api.getMessage("message_1")
    expect(isSuccess(messageResult)).toBeTruthy()
    const message = messageResult as OutputApiAuditLog

    expect(message.events).toHaveLength(1)
    expect(message.events[0]).toStrictEqual({
      eventSource: "me",
      attributes: { "Record ID": 1 },
      eventCode: EventCode.ErrorRecordArchived,
      eventType: "Error record archival",
      category: "information",
      timestamp: "2022-04-26T12:53:55.000Z"
    })

    // Assert postgres results
    const recordQueryResult = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id = 1`
    )
    expect(recordQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
    expect(recordQueryResult.rows[0].audit_log_attempts).toBe(1)
    const groupQueryResult = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id = 1`)
    expect(groupQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
  })

  it("should mark an audit log group as completed when all succeed", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, '2022-04-26T12:53:55.000Z', 'error-archival-process-1', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES
      (1, 'message_1', 1),
      (2, 'message_2', 1),
      (3, 'message_3', 1),
      (4, 'message_4', 1)`
    )

    // Insert testdata into audit log
    const messages: Partial<InputApiAuditLog>[] = [
      { messageId: "message_1" },
      { messageId: "message_2" },
      { messageId: "message_3" },
      { messageId: "message_4" }
    ]

    for (const message of messages) {
      await createMockAuditLog(message)
    }

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    for (const [index, messageId] of messages.map((message) => message.messageId).entries()) {
      const messageResult = await api.getMessage(messageId!)
      expect(isSuccess(messageResult)).toBeTruthy()
      const message = messageResult as OutputApiAuditLog

      expect(message.events).toHaveLength(1)
      expect(message.events[0].eventType).toBe("Error record archival")
      expect(message.events[0].attributes?.["Record ID"]).toBe(index + 1)
    }

    // Assert postgres results
    const recordQueryResults = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id IN (1, 2, 3, 4)`
    )
    for (const row of recordQueryResults.rows) {
      expect(row.audit_logged_at.toISOString().length).toBeGreaterThan(0)
      expect(row.audit_log_attempts).toBe(1)
    }
    const groupQueryResult = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id = 1`)
    expect(groupQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
  })

  it("should mark multiple audit log groups as completed when all succeed", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES
      (1, '2022-04-26T12:53:55.000Z', 'error-archival-process-1', NULL),
      (2, '2022-04-27T13:09:21.000Z', 'error-archival-process-2', NULL)
      `
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES
      (1, 'message_1', 1),
      (2, 'message_2', 2),
      (3, 'message_3', 1),
      (4, 'message_4', 2)`
    )

    // Insert testdata into audit log
    const messages = [
      { messageId: "message_1" },
      { messageId: "message_2" },
      { messageId: "message_3" },
      { messageId: "message_4" }
    ]

    for (const message of messages) {
      await createMockAuditLog(message)
    }

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    for (const [index, messageId] of messages.map((message) => message.messageId).entries()) {
      const messageResult = await api.getMessage(messageId)
      expect(isSuccess(messageResult)).toBeTruthy()
      const message = messageResult as OutputApiAuditLog

      expect(message.events).toHaveLength(1)
      expect(message.events[0].eventType).toBe("Error record archival")
      expect(message.events[0].attributes?.["Record ID"]).toBe(index + 1)
    }

    // Assert postgres results
    const recordQueryResults = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id IN (1, 2, 3, 4)`
    )
    for (const row of recordQueryResults.rows) {
      expect(row.audit_logged_at.toISOString().length).toBeGreaterThan(0)
      expect(row.audit_log_attempts).toBe(1)
    }
    const groupQueryResults = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id IN (1, 2)`)
    for (const row of groupQueryResults.rows) {
      expect(row.audit_logged_at.toISOString().length).toBeGreaterThan(0)
    }
  })

  it("should only audit log as many archive groups as configured", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES
      (1, '2022-04-26T12:53:55.000Z', 'error-archival-process-1', NULL),
      (2, '2022-04-27T13:09:21.000Z', 'error-archival-process-2', NULL)
      `
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES
      (1, 'message_1', 1),
      (2, 'message_2', 2),
      (3, 'message_3', 1),
      (4, 'message_4', 2)`
    )

    // Insert testdata into audit log
    const messages = [
      {
        messageId: "message_1",
        archiveLogGroup: 1
      },
      {
        messageId: "message_2",
        archiveLogGroup: 2
      },
      {
        messageId: "message_3",
        archiveLogGroup: 1
      },
      {
        messageId: "message_4",
        archiveLogGroup: 2
      }
    ]

    for (const message of messages) {
      await createMockAuditLog(message)
    }

    // Invoke lambda
    await executeLambda({ ...lambdaEnvironment, ARCHIVE_GROUP_LIMIT: 1 })

    // Helper function to determine if all audit log results in an array belong to the same archive log group
    const allSameArchiveLogGroup = (arr: any) => arr.every((v: any) => v.archiveLogGroup === arr[0].archiveLogGroup)

    // Assert only one archive log group gets audit logged
    const auditLogResults = await Promise.all(
      messages.map(async (message) => {
        const messageResult = await api.getMessage(message.messageId)
        expect(isSuccess(messageResult)).toBeTruthy()
        const auditLogMessage = messageResult as OutputApiAuditLog
        return {
          messageId: message.messageId,
          archiveLogGroup: message.archiveLogGroup,
          isAuditLogged: auditLogMessage?.events?.length > 0
        }
      })
    )
    const [auditLogged, notAuditLogged] = partition(
      auditLogResults,
      (result: { isAuditLogged: boolean }) => result.isAuditLogged
    )

    expect(allSameArchiveLogGroup(auditLogged)).toBeTruthy()
    expect(allSameArchiveLogGroup(notAuditLogged)).toBeTruthy()

    // Assert only one archive log group is marked as audit logged in postgres
    const groupQueryResults = (await pg.query(`SELECT log_id, audit_logged_at FROM br7own.archive_log GROUP BY log_id`))
      .rows
    expect(groupQueryResults.filter((row) => row.audit_logged_at !== null)).toHaveLength(1)
    expect(groupQueryResults.filter((row) => row.audit_logged_at === null)).toHaveLength(1)
  })

  it("should mark an audit log group as completed when all records have already been completed", async () => {
    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES
      (1, '2022-04-26T12:53:55.000Z', 'me', NULL),
      (2, '2022-03-26T12:53:55.000Z', 'you', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id, audit_logged_at, audit_log_attempts) VALUES
      (1, 'message_1', 1, NULL, 0),
      (2, 'message_2', 2, '2022-05-26T12:53:55.000Z', 1),
      (3, 'message_3', 2, '2022-05-26T12:53:55.000Z', 1)`
    )

    // Insert testdata into audit log
    await Promise.all(
      [1, 2, 3].map((messageNumber) => {
        const messageId = `message_${messageNumber}`
        const message = mockInputApiAuditLog({
          externalCorrelationId: messageId,
          receivedDate: "2022-05-26T12:53:55.000Z",
          messageHash: messageId,
          messageId: messageId,
          caseId: messageId,
          createdBy: "add-archival-events e2e tests"
        })

        return api.createAuditLog(message)
      })
    )

    const existingEvent2 = mockApiAuditLogEvent({
      eventSource: "you",
      category: "information",
      eventType: "Error record archival",
      timestamp: "2022-05-26T12:53:55.000Z",
      attributes: { "Record ID": 2 }
    })
    await api.createEvent("message_2", existingEvent2)

    const existingEvent3 = mockApiAuditLogEvent({
      eventSource: "you",
      category: "information",
      eventType: "Error record archival",
      timestamp: "2022-05-26T12:53:55.000Z",
      attributes: { "Record ID": 3 }
    })
    await api.createEvent("message_3", existingEvent3)

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    for (let i = 0; i < 3; i++) {
      const message = (await api.getMessage("message_" + (i + 1))) as OutputApiAuditLog

      expect(isSuccess(message)).toBeTruthy()
      expect(message.events).toHaveLength(1)
      expect(message.events[0].eventType).toBe("Error record archival")
      expect(message.events[0].attributes?.["Record ID"]).toBe(i + 1)
    }

    // Assert postgres results
    const recordQueryResults = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id IN (1, 2, 3)`
    )
    expect(recordQueryResults.rows).toHaveLength(3)
    for (const row of recordQueryResults.rows) {
      expect(row.audit_logged_at).not.toBeNull()
      expect(row.audit_logged_at.toISOString().length).toBeGreaterThan(0)
      expect(row.audit_log_attempts).toBe(1)
    }

    const groupQueryResult = await pg.query(`SELECT log_id, audit_logged_at FROM br7own.archive_log`)
    expect(groupQueryResult.rows).toHaveLength(2)
    for (const row of groupQueryResult.rows) {
      expect(row.audit_logged_at).not.toBeNull()
      expect(row.audit_logged_at.toISOString().length).toBeGreaterThan(0)
    }
  })

  it("should audit log single error records with legacy IDs and no existing audit log successfully", async () => {
    const legacyRecordId = "202114:29ID:414d5120574153514d30322020202020c5450e608af19a23"

    // Insert testdata into postgres
    await pg.query(
      `INSERT INTO br7own.archive_log (log_id, archived_at, archived_by, audit_logged_at) VALUES (1, '2022-04-26T12:53:55.000Z', 'me', NULL)`
    )
    await pg.query(
      `INSERT INTO br7own.archive_error_list (error_id, message_id, archive_log_id) VALUES (1, '${legacyRecordId}', 1)`
    )

    // Invoke lambda
    await executeLambda()

    // Assert audit log results
    const messageResult = await api.getMessage(legacyRecordId)
    expect(isSuccess(messageResult)).toBeTruthy()
    const message = messageResult as OutputApiAuditLog

    expect(message.events).toHaveLength(1)
    expect(message.events[0]).toStrictEqual({
      eventSource: "me",
      attributes: { "Record ID": 1 },
      eventCode: EventCode.ErrorRecordArchived,
      eventType: "Error record archival",
      category: "information",
      timestamp: "2022-04-26T12:53:55.000Z"
    })

    // Assert postgres results
    const recordQueryResult = await pg.query(
      `SELECT audit_logged_at, audit_log_attempts FROM br7own.archive_error_list WHERE error_id = 1`
    )
    expect(recordQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
    expect(recordQueryResult.rows[0].audit_log_attempts).toBe(1)
    const groupQueryResult = await pg.query(`SELECT audit_logged_at FROM br7own.archive_log WHERE log_id = 1`)
    expect(groupQueryResult.rows[0].audit_logged_at.toISOString().length).toBeGreaterThan(0)
  })
})
