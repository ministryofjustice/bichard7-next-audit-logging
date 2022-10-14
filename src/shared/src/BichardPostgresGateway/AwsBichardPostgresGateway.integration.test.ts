jest.setTimeout(15000)
import pg from "pg"
import type { PostgresConfig } from "shared-types"
import { isError } from "shared-types"
import TestPostgresGateway from "../PostgresGateway/TestPostgresGateway"
import AwsBichardPostgresGateway from "./AwsBichardPostgresGateway"

const config: PostgresConfig = {
  HOST: "localhost",
  PORT: 5433,
  USERNAME: "bichard",
  PASSWORD: "password",
  DATABASE_NAME: "bichard",
  TABLE_NAME: "br7own.archive_error_list",
  SSL: false
}

const gateway = new AwsBichardPostgresGateway(config)
const testGateway = new TestPostgresGateway(config)

beforeEach(async () => {
  await testGateway.truncateTable()
})

afterAll(async () => {
  await testGateway.dispose()
  await gateway.dispose()
})

describe("BichardPostgresGateway", () => {
  it("deletes all matching records from the archive table", async () => {
    const messageId = "messageID"
    const otherMessageId = "otherMessageID"
    const records = [{ message_id: messageId }, { message_id: messageId }, { message_id: otherMessageId }]
    await testGateway.insertRecords(records)

    const result = await gateway.deleteArchivedErrors(messageId)
    expect(isError(result)).toBe(false)

    const allResults = await testGateway.findAll()
    expect(allResults).toHaveLength(1)
    expect(allResults?.[0]).toHaveProperty("message_id", otherMessageId)
  })

  it("deletes no records when there are no matching records", async () => {
    const otherMessageId = "otherMessageID"
    const otherRecord = [{ message_id: otherMessageId }]
    await testGateway.insertRecords(otherRecord)

    const result = await gateway.deleteArchivedErrors("someMessageId")
    expect(isError(result)).toBe(false)

    const allResults = await testGateway.findAll()
    expect(allResults).toHaveLength(1)
    expect(allResults?.[0]).toHaveProperty("message_id", otherMessageId)
  })

  it("returns error when Postgres returns error", async () => {
    const expectedErrorMessage = "Dummy error"
    jest.spyOn(pg.Client.prototype, "query").mockImplementation(() => Promise.reject(Error(expectedErrorMessage)))

    const result = await gateway.deleteArchivedErrors("someMessageId")
    expect(isError(result)).toBe(true)
  })
})
