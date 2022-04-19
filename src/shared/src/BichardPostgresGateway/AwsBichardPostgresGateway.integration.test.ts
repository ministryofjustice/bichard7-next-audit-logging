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
  await testGateway.connect()
  await testGateway.createTable()
})

afterEach(async () => {
  await testGateway.dropTable()
  await testGateway.closeConnection()
})

describe("BichardPostgresGateway", () => {
  it("deletes all matching records from the archive table", async () => {
    const messageId = "someMessageID"
    await testGateway.insertRecord(messageId)

    await gateway.deleteArchivedErrors(messageId)

    const records = await testGateway.findAllByMessageId(messageId)
    expect(records.rows).toHaveLength(0)
  })

  // it("deletes no records when there are no matching records", () => {

  // })

  // it("returns error when Postgres returns error", () => {

  // })
})
