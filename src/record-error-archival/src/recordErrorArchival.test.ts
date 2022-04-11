import { Client } from "pg"
import "shared-testing"
import { FakeApiClient, setEnvironmentVariables } from "shared-testing"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import DatabaseClient from "./DatabaseClient"
import { recordErrorArchival } from "./recordErrorArchival"

setEnvironmentVariables()

type DbReturnType = {
  error_id: string
  message_id: string
  archived_at: string
  archived_by: string
  archive_log_id: string
}

const originalEnv = process.env

const createStubDbWithRecords = (records: ArchivedErrorRecord[]): DatabaseClient => {
  return {
    fetchUnloggedArchivedErrors: jest.fn(() => records),
    connect: jest.fn(),
    disconnect: jest.fn(),
    markArchiveGroupAuditLogged: jest.fn(),
    markErrorsAuditLogged: jest.fn()
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

const dbResult: { rows: DbReturnType[] } = {
  rows: [
    {
      error_id: "1",
      message_id: "Message1",
      archived_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      archived_by: "Error archiver process 1",
      archive_log_id: "1"
    },
    {
      error_id: "2",
      message_id: "Message2",
      archived_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      archived_by: "Error archiver process 1",
      archive_log_id: "1"
    },
    {
      error_id: "3",
      message_id: "Message3",
      archived_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      archived_by: "Error archiver process 1",
      archive_log_id: "1"
    },
    {
      error_id: "4",
      message_id: "Message4",
      archived_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
      archived_by: "Error archiver process 1",
      archive_log_id: "1"
    }
  ]
}

const stripWhitespace = (string: string) => string.replace(/\s/g, "")

describe("Record Error Archival integration", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: jest.Mocked<any>

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
  })

  afterEach(() => {
    process.env = originalEnv // reset env vars
    jest.clearAllMocks()
  })

  it("Should create an audit log event when a single error record is archived", async () => {
    const archivalDate = new Date("2022-04-06 09:45:15")
    const stubDb = createStubDbWithRecords([
      {
        errorId: 1n,
        messageId: "Message01",
        archivedAt: archivalDate,
        archivedBy: "Error archiver process 1",
        archiveLogId: 1n
      }
    ])
    const api = new FakeApiClient()
    const apiSpy = jest.spyOn(api, "createEvent")

    await recordErrorArchival(stubDb, api)

    expect(apiSpy).toHaveBeenCalledTimes(1)

    expect(apiSpy).toHaveBeenCalledWith(
      "Message01",
      expect.objectContaining({
        eventSource: "Error archiver process 1",
        category: "information",
        eventType: "Error archival",
        timestamp: archivalDate.toISOString(),
        attributes: { "Error ID": 1n }
      })
    )
  })

  it("Should create audit log events with a timestamp of when the archival occured", async () => {
    const errorRecords = [
      {
        errorId: BigInt(Math.floor(Math.random() * 10_000)),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        archiveLogId: 1n
      },
      {
        errorId: BigInt(Math.floor(Math.random() * 10_000)),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        archiveLogId: 1n
      },
      {
        errorId: BigInt(Math.floor(Math.random() * 10_000)),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        archiveLogId: 1n
      },
      {
        errorId: BigInt(Math.floor(Math.random() * 10_000)),
        messageId: "Message" + Math.floor(Math.random() * 10_000),
        archivedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        archivedBy: "Error archiver process 1",
        archiveLogId: 1n
      }
    ]
    const stubDb = createStubDbWithRecords(errorRecords)
    const api = new FakeApiClient()
    const apiSpy = jest.spyOn(api, "createEvent")

    await recordErrorArchival(stubDb, api)

    expect(apiSpy).toHaveBeenCalledTimes(errorRecords.length)

    for (const errorRecord of errorRecords) {
      expect(apiSpy).toHaveBeenCalledWith(
        errorRecord.messageId,
        expect.objectContaining({
          eventSource: errorRecord.archivedBy,
          category: "information",
          eventType: "Error archival",
          timestamp: errorRecord.archivedAt.toISOString(),
          attributes: { "Error ID": errorRecord.errorId }
        })
      )
    }
  })

  it("Should mark achive groups as audit logged when all succeed", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", "", "schema", 100)
    const api = new FakeApiClient()

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)

    // Expect individual archive logs to be updated
    expect(stripWhitespace(client.query.mock.calls[1][0])).toContain(
      stripWhitespace("UPDATE schema.archive_error_list SET audit_logged_at = NOW()")
    )
    expect(client.query.mock.calls[1][1]).toStrictEqual(["1", "2", "3", "4"])

    // Expect archive log group to be updated
    expect(stripWhitespace(client.query.mock.calls[2][0])).toBe(
      stripWhitespace("UPDATE schema.archive_log SET audit_logged_at = NOW() WHERE log_id = $1")
    )
    expect(client.query.mock.calls[2][1]).toStrictEqual([1n])
  })

  it("Shouldn't mark archive groups as audit logged when all fail", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", "", "schema", 100)
    const api = new FakeApiClient()
    api.shouldReturnError(new Error("API failed :("), ["createEvent"])

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.query.mock.calls[0][0].split(" ")[0]).toBe("SELECT")
  })

  it("Shouldn't mark achive groups as audit logged when some fail", async () => {
    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", "", "schema", 100)
    const api = new FakeApiClient()
    api.shouldReturnErrorAfterNCalls(new Error("API quota exceeded"), 2, ["createEvent"])

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(2)

    // Expect individual archive logs to be updated
    expect(stripWhitespace(client.query.mock.calls[1][0])).toContain(
      stripWhitespace("UPDATE schema.archive_error_list SET audit_logged_at = NOW()")
    )
    expect(client.query.mock.calls[1][1]).toStrictEqual(["3", "4"])

    // Expect archive log group to not be updated
    expect(String(client.query.mock.calls[0][0]).includes("UPDATE archive_log")).toBeFalsy()
    expect(String(client.query.mock.calls[1][0]).includes("UPDATE archive_log")).toBeFalsy()
  })

  it("Should limit the number of archive log groups to a configured value", async () => {
    const db = new DatabaseClient("", "", "", "", "schema", 50)
    const api = new FakeApiClient()

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(String(client.query.mock.calls[0][0]).includes("LIMIT $1")).toBeTruthy()
    expect(client.query.mock.calls[0][1]).toStrictEqual([50])
  })

  it("Should mark individual archive logs as audit logged", async () => {
    expect(true).toBeTruthy()

    client.query.mockImplementation(() => {
      return Promise.resolve(dbResult)
    })

    const db = new DatabaseClient("", "", "", "", "schema", 100)
    const api = new FakeApiClient()

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(3)
    expect(
      stripWhitespace(client.query.mock.calls[1][0]).includes(
        stripWhitespace("UPDATE schema.archive_error_list SET audit_logged_at = NOW() WHERE error_id IN")
      )
    ).toBeTruthy()
    expect(client.query.mock.calls[1][1]).toStrictEqual(["1", "2", "3", "4"])
  })
})
