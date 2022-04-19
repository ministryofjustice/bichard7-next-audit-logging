import type { BichardPostgresGateway, PostgresConfig, PromiseResult } from "shared-types"
const { Client } = require("pg")

export default class TestBichardPostgresGateway implements BichardPostgresGateway {
  private readonly client

  constructor(config: PostgresConfig) {
    this.client = new Client({
      host: config.HOST,
      port: 5432,
      user: config.USERNAME,
      password: config.PASSWORD
    })
  }

  async connect() {
    await this.client.connect()
  }

  async closeConnection() {
    await this.client.end()
  }

  async createTable() {
    await this.client
      .query(
        `
      CREATE TABLE archive_error_list (
        message_id varchar(70),
        updated_msg text
      );`
      )
      .catch((e: { stack: any }) => console.error(e.stack))
  }

  async dropTable() {
    await this.client.query("DROP TABLE archive_error_list;").catch((e: { stack: any }) => console.error(e.stack))
  }

  async deleteArchivedErrors(messageId: string): PromiseResult<void> {
    console.log(messageId)
  }

  async insertRecord(messageId: string) {
    return this.client.query(
      `insert into archive_error_list ("message_id","updated_msg") VALUES ('${messageId}','dummy data');`
    )
  }

  async findAllByMessageId(messageId: string): PromiseResult<any> {
    return this.client.query(`SELECT * FROM archive_error_list WHERE message_id='${messageId}'`)
  }
}
