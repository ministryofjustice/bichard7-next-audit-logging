/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from "pg"
import { FakeApiClient, setEnvironmentVariables } from "shared-testing"
import type { AuditLogEvent, KeyValuePair } from "shared-types"
import type { BichardRecord, DatabaseRow, Dictionary } from "./db"
import DatabaseClient from "./db"
import { addBichardRecordsToAuditLog } from "./addArchivalEvents"

setEnvironmentVariables()

const originalEnv = process.env

const createStubDbWithRecords = (records: Dictionary<BichardRecord[]>): DatabaseClient => {
  return {
    fetchUnloggedBichardRecords: jest.fn(() => records),
    connect: jest.fn(),
    disconnect: jest.fn(),
    markBichardRecordGroupAuditLogged: jest.fn(),
    markBichardRecordsAuditLogFailed: jest.fn(),
    markBichardRecordsAuditLogged: jest.fn(),
    markUnmarkedGroupsCompleted: jest.fn()
  } as unknown as DatabaseClient
}

jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn().mockReturnValue(Promise.resolve()),
    end: jest.fn().mockReturnValue(Promise.resolve()),
    query: jest.fn()
  }
  return {
    Client: jest.fn().mockImplementation(() => mClient)
  }
})

const dbResult: { rows: DatabaseRow[] } = {
  rows: [
    {
      error_id: 1,
      message_id: "Message1",
      archived_at: "2022-04-25 10:28:14.552",
      archived_by: "Error archiver process 1",
      archive_log_id: 1
    },
    {
      error_id: 2,
      message_id: "Message2",
      archived_at: "2022-04-17 02:18:55.476",
      archived_by: "Error archiver process 1",
      archive_log_id: 1
    },
    {
      error_id: 3,
      message_id: "Message3",
      archived_at: "2022-04-20 10:58:01.597",
      archived_by: "Error archiver process 1",
      archive_log_id: 1
    },
    {
      error_id: 4,
      message_id: "Message4",
      archived_at: "2022-04-24 04:52:17.347",
      archived_by: "Error archiver process 1",
      archive_log_id: 1
    }
  ]
}

const stripWhitespace = (string: string) => string.replace(/\s/g, "")

describe("Add Archival Events integration", () => {
  let client: jest.Mocked<any>
  let api: jest.Mocked<any>

  beforeEach(() => {
    jest.resetModules() // reset the cache of all required modules
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      API_URL: "http://localhost:3010",
      API_KEY: "testApiKey",
      DB_NAME: "bichard",
      DB_HOST: "localhost",
      DB_PASSWORD: "password",
      DB_USER: "bichard",
      DB_SCHEMA: "br7own"
    }
    client = new Client()
    api = new FakeApiClient()
  })

  afterEach(() => {
    process.env = originalEnv // reset env vars
    jest.clearAllMocks()
  })

  it("Should create an audit log event when a single error record is archived", async () => {
    const archivalDate = new Date("2022-04-06 09:45:15")
    const stubDb = createStubDbWithRecords({
      1: [
        {
          recordId: 1,
          messageId: "Message01",
          archivedAt: archivalDate,
          archivedBy: "Error archiver process 1",
          groupId: 1
        }
      ]
    })
    const apiSpy = jest.spyOn(api, "createEvent")

    await addBichardRecordsToAuditLog(stubDb, api)

    expect(apiSpy).toHaveBeenCalledTimes(1)

    expect(apiSpy).toHaveBeenCalledWith(
      "Message01",
      expect.objectContaining({
        eventSource: "Error archiver process 1",
        category: "information",
        eventType: "Error record archival",
        timestamp: archivalDate.toISOString(),
        attributes: { "Record ID": 1 }
      })
    )
  })

  it("Should create audit log events with a timestamp of when the archival occured", async () => {
    const records = [
      {
        recordId: Math.floor(Math.random() * 10_000),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        groupId: 1
      },
      {
        recordId: Math.floor(Math.random() * 10_000),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        groupId: 1
      },
      {
        recordId: Math.floor(Math.random() * 10_000),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        groupId: 1
      },
      {
        recordId: Math.floor(Math.random() * 10_000),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        groupId: 1
      }
    ]
    const stubDb = createStubDbWithRecords({ 1: records })
    const apiSpy = jest.spyOn(api, "createEvent")

    await addBichardRecordsToAuditLog(stubDb, api)

    expect(apiSpy).toHaveBeenCalledTimes(records.length)

    for (const errorRecord of records) {
      expect(apiSpy).toHaveBeenCalledWith(
        errorRecord.messageId,
        expect.objectContaining({
          eventSource: errorRecord.archivedBy,
          category: "information",
          eventType: "Error record archival",
          timestamp: errorRecord.archivedAt.toISOString(),
          attributes: { "Record ID": errorRecord.recordId }
        })
      )
    }
  })

  it("Should mark archive groups as audit logged when all succeed", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", false, "", "schema", 100)

    await addBichardRecordsToAuditLog(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)

    // Expect individual archive logs to be updated
    expect(stripWhitespace(client.query.mock.calls[1][0])).toContain(
      stripWhitespace("UPDATE schema.archive_error_list SET audit_logged_at = NOW()")
    )
    expect(client.query.mock.calls[1][1]).toStrictEqual([1, 2, 3, 4])

    // Expect archive log group to be updated
    expect(stripWhitespace(client.query.mock.calls[2][0])).toBe(
      stripWhitespace("UPDATE schema.archive_log SET audit_logged_at = NOW() WHERE log_id = $1")
    )
    expect(client.query.mock.calls[2][1]).toStrictEqual([1])
  })

  it("Shouldn't mark archive groups as audit logged when all fail", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", false, "", "schema", 100)
    api.setErrorReturnedByFunctions(new Error("API failed :("), ["createEvent"])

    await addBichardRecordsToAuditLog(db, api)

    expect(client.query).toHaveBeenCalledTimes(2)
    expect(client.query.mock.calls[0][0].split(" ")[0]).toBe("SELECT")

    expect(
      stripWhitespace(String(client.query.mock.calls[1][0])).includes(
        stripWhitespace("UPDATE schema.archive_error_list SET audit_log_attempts = audit_log_attempts + 1")
      )
    ).toBeTruthy()
    expect(client.query.mock.calls[1][1]).toStrictEqual([1, 2, 3, 4])
  })

  it("Shouldn't mark achive groups as audit logged when some fail", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", false, "", "schema", 100)
    // Each error requires 2 calls: one to getMessage and one to createEvent
    api.setErrorReturnedByFunctionsAfterNCalls(new Error("API quota exceeded"), 4, ["createEvent"])

    await addBichardRecordsToAuditLog(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)

    // Expect individual archive logs to be updated
    expect(stripWhitespace(client.query.mock.calls[1][0])).toContain(
      stripWhitespace("UPDATE schema.archive_error_list SET audit_logged_at = NOW()")
    )
    expect(client.query.mock.calls[1][1]).toStrictEqual([1, 2])

    // Expect archive log group to not be updated
    expect(String(client.query.mock.calls[0][0]).includes("UPDATE schema.archive_log")).toBeFalsy()
    expect(String(client.query.mock.calls[1][0]).includes("UPDATE schema.archive_log")).toBeFalsy()

    // Expect the number of archive log attempts to be incremented
    expect(
      stripWhitespace(String(client.query.mock.calls[2][0])).includes(
        stripWhitespace("UPDATE schema.archive_error_list SET audit_log_attempts = audit_log_attempts + 1")
      )
    ).toBeTruthy()
    expect(client.query.mock.calls[2][1]).toStrictEqual([3, 4])
  })

  it("Should limit the number of archive log groups to a configured value", async () => {
    const db = new DatabaseClient("", "", "", false, "", "schema", 50)

    await addBichardRecordsToAuditLog(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(String(client.query.mock.calls[0][0]).includes("LIMIT $1")).toBeTruthy()
    expect(client.query.mock.calls[0][1]).toStrictEqual([50])
  })

  it("Should mark individual archive logs as audit logged", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", false, "", "schema", 100)

    await addBichardRecordsToAuditLog(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(
      stripWhitespace(client.query.mock.calls[1][0]).includes(
        stripWhitespace(
          "UPDATE schema.archive_error_list SET audit_logged_at = NOW(), audit_log_attempts = audit_log_attempts + 1 WHERE error_id IN"
        )
      )
    ).toBeTruthy()
    expect(client.query.mock.calls[1][1]).toStrictEqual([1, 2, 3, 4])
  })

  it("Should report failures when the database fails to update", async () => {
    const db = new DatabaseClient("", "", "", false, "", "schema", 100)

    client.query.mockImplementation(
      jest.fn().mockRejectedValue(new Error("Database host on fire")).mockResolvedValueOnce(dbResult)
    )

    await addBichardRecordsToAuditLog(db, api)
    expect(client.query).toHaveBeenCalledTimes(3)
  })

  it("Shouldn't create duplicate audit log events for archival when one already exists", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", false, "", "schema", 100)

    // Add a message with the archived event to the API
    api.addMessage({
      messageId: "Message2",
      receivedDate: new Date().toISOString(),
      events: [
        <AuditLogEvent>{
          eventSource: "Error archiver process 1",
          category: "information",
          eventType: "Error record archival",
          timestamp: new Date().toISOString(),
          attributes: { "Record ID": 2 } as KeyValuePair<string, number>
        }
      ]
    })

    const apiSpy = jest.spyOn(api, "createEvent")

    await addBichardRecordsToAuditLog(db, api)
    expect(apiSpy).toHaveBeenCalledTimes(3)
    // Don't create an audit log event for the message which already has one
    expect(apiSpy.mock.calls.map((args) => args[0])).not.toContain("Message2")
  })
})
