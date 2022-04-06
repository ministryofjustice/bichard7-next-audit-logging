import "shared-testing"
import { FakeApiClient, setEnvironmentVariables } from "shared-testing"
import { recordErrorArchival } from "./recordErrorArchival"
import type DatabaseClient from "./DatabaseClient"
import type { ArchivedErrorRecord } from "./DatabaseClient"
import "jest-extended"

setEnvironmentVariables()

const originalEnv = process.env

const createStubDbWithRecords = (records: ArchivedErrorRecord[]): DatabaseClient => {
  return {
    fetchUnloggedArchivedErrors: jest.fn(() => records),
    connect: jest.fn(),
    disconnect: jest.fn()
  } as unknown as DatabaseClient
}

describe("Record Error Archival end-to-end", () => {
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
  })

  afterEach(() => {
    process.env = originalEnv // reset env vars
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
})
