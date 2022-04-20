import { isError } from "shared-types"
import PostgresGateway from "src/PostgresGateway/PostgresGateway"

export default class TestPostgresGateway extends PostgresGateway {
  async createArchiveErrorListTable(): Promise<void> {
    await this.query(
      `
      CREATE TABLE archive_error_list (
        message_id varchar(70),
        updated_msg text
      );`
    )
  }

  async dropTable(): Promise<void> {
    await this.query("DROP TABLE archive_error_list;").catch((e: { stack: string }) => console.error(e.stack))
  }

  async insertRecords<T>(records: T[]): Promise<void> {
    await Promise.all(
      records.map((record) => {
        const keys = Object.keys(record)
        const columns = keys.join(",")
        const params = keys.map((_, index) => `$${index + 1}`).join(",")
        const values = keys.map((key) => (record as any)[key])
        const queryString = `insert into archive_error_list (${columns}) VALUES (${params});`
        return this.query(queryString, values)
      })
    )
  }

  async findAll<T>(): Promise<T[]> {
    const records = await this.query(`SELECT * FROM archive_error_list`)
    if (isError(records)) {
      throw records
    }

    return records.rows as T[]
  }
}
