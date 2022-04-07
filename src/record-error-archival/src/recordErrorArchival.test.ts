import "shared-testing"
import { FakeApiClient, setEnvironmentVariables } from "shared-testing"
import { recordErrorArchival } from "./recordErrorArchival"
import DatabaseClient from "./DatabaseClient"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import "jest-extended"
import { Client } from "pg"

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
    markArchiveGroupAuditLogged: jest.fn()
  } as unknown as DatabaseClient
}

jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn().mockReturnValue(Promise.resolve()),
    end: jest.fn().mockReturnValue(Promise.resolve())
  }
  return { Client: jest.fn(() => mClient) }
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

describe("Record Error Archival integration", () => {
  let client: jest.Mocked<Client>

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
    const db = new DatabaseClient("", "", "", "", "schema")
    const api = new FakeApiClient()
    client.query = jest.fn((_query, _args) => {
      return dbResult
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pgMock = jest.spyOn(client, "query").mockImplementation()

    await recordErrorArchival(db, api)

    expect(client.query).toHaveBeenCalledTimes(2)
    expect(pgMock.mock.calls[1][0].replace(/\s/g, "")).toBe(
      "UPDATE schema.archive_log SET audit_logged_at = NOW() WHERE log_id = $1".replace(/\s/g, "")
    )
    expect(pgMock.mock.calls[1][1]).toStrictEqual([1n])
  })
})
