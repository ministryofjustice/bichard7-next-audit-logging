import type { PostgresConfig } from "shared-types"
import AwsBichardPostgresGateway from "./AwsBichardPostgresGateway"
import TestBichardPostgresGateway from "./TestBichardPostgresGateway"

const config: PostgresConfig = {
  HOST: "localhost",
  USERNAME: "bichard",
  PASSWORD: "password",
  DATABASE_NAME: ""
}

const gateway = new AwsBichardPostgresGateway(config)
const testGateway = new TestBichardPostgresGateway(config)

beforeEach(async () => {
  await testGateway.dropTable()
  await testGateway.createArchiveErrorListTable()
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

    await gateway.deleteArchivedErrors(messageId)

    const allResults = await testGateway.findAll()
    expect(allResults).toHaveLength(1)
    expect(allResults).toEqual([{ message_id: otherMessageId, updated_msg: "Other dummy data" }])
  })

  it("deletes no records when there are no matching records", async () => {
    const otherMessageId = "otherMessageID"
    const otherRecord = [{ message_id: otherMessageId, updated_msg: "Other dummy data" }]
    await testGateway.insertRecords(otherRecord)

    await gateway.deleteArchivedErrors("someMessageId")

    const records = await testGateway.findAll()
    expect(records).toHaveLength(1)
    expect(records).toEqual([{ message_id: otherMessageId, updated_msg: "Other dummy data" }])
  })

  // it("returns error when Postgres returns error", () => {

  // })
})
