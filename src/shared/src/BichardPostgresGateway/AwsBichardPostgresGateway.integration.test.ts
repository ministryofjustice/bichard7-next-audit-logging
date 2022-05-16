jest.setTimeout(15000)
import pg from "pg"
import type { PostgresConfig } from "shared-types"
import { isError } from "shared-types"
import TestPostgresGateway from "../PostgresGateway/TestPostgresGateway"
import AwsBichardPostgresGateway from "./AwsBichardPostgresGateway"

const config: PostgresConfig = {
  HOST: "localhost",
  PORT: 5432,
  USERNAME: "bichard",
  PASSWORD: "password",
  DATABASE_NAME: "bichard",
  TABLE_NAME: "br7own.archive_error_list",
  SSL: false
}

const gateway = new AwsBichardPostgresGateway(config)
const testGateway = new TestPostgresGateway(config)

beforeEach(async () => {
  await testGateway.dropTable()
  await testGateway.createTable({
    message_id: "varchar(70)",
    updated_msg: "text"
  })
})

afterAll(async () => {
  await testGateway.dispose()
  await gateway.dispose()
})

describe("BichardPostgresGateway", () => {
  it("deletes all matching records from the archive table", async () => {
    const messageId = "messageID"
    const otherMessageId = "otherMessageID"
    const records = [
      { message_id: messageId, updated_msg: "Dummy data" },
      { message_id: messageId, updated_msg: "Dummy data" },
      { message_id: otherMessageId, updated_msg: "Other dummy data" }
    ]
    await testGateway.insertRecords(records)

    const result = await gateway.deleteArchivedErrors(messageId)
    if (isError(result)) {
      console.log(JSON.stringify(result))
    }
    expect(isError(result)).toBe(false)

    const allResults = await testGateway.findAll()
    expect(allResults).toHaveLength(1)
    expect(allResults).toEqual([{ message_id: otherMessageId, updated_msg: "Other dummy data" }])
  })

  it("deletes no records when there are no matching records", async () => {
    const otherMessageId = "otherMessageID"
    const otherRecord = [{ message_id: otherMessageId, updated_msg: "Other dummy data" }]
    await testGateway.insertRecords(otherRecord)

    const result = await gateway.deleteArchivedErrors("someMessageId")
    expect(isError(result)).toBe(false)

    const records = await testGateway.findAll()
    expect(records).toHaveLength(1)
    expect(records).toEqual([{ message_id: otherMessageId, updated_msg: "Other dummy data" }])
  })

  it("returns error when Postgres returns error", async () => {
    const expectedErrorMessage = "Dummy error"
    jest.spyOn(pg.Client.prototype, "query").mockImplementation(() => Promise.reject(Error(expectedErrorMessage)))

    const result = await gateway.deleteArchivedErrors("someMessageId")
    if (isError(result)) {
      console.log(JSON.stringify(result))
    }
    expect(isError(result)).toBe(true)
  })
})
