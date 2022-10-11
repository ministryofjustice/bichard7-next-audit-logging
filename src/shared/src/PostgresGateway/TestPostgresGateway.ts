import type { KeyValuePair } from "shared-types"
import { isError } from "shared-types"
import PostgresGateway from "./PostgresGateway"

export default class TestPostgresGateway extends PostgresGateway {
  async createSchema(schema: string): Promise<void> {
    await this.query(`CREATE SCHEMA ${schema}`).catch((error) => console.error(error))
  }

  async createTable(columns: KeyValuePair<string, string>): Promise<void> {
    await this.query(
      `
      CREATE TABLE ${this.tableName} (
        ${Object.keys(columns)
          .map((key) => `${key} ${columns[key]}`)
          .join(",")}
      );`
    ).catch((error) => console.error(error))
  }

  async dropTable(): Promise<void> {
    await this.query(`DROP TABLE ${this.tableName};`).catch((error) => console.error(error))
  }

  async insertRecords(records: object[]): Promise<void> {
    await Promise.all(
      records.map((record) => {
        const keys = Object.keys(record)
        const columns = keys.join(",")
        const params = keys.map((_, index) => `$${index + 1}`).join(",")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const values = keys.map((key) => (record as any)[key])
        const queryString = `insert into ${this.tableName} (${columns}) VALUES (${params});`
        return this.query(queryString, values).catch((error) => {
          console.error(error)
        })
      })
    )
  }

  async findAll<T>(): Promise<T[] | undefined> {
    const records = await this.query(`SELECT * FROM ${this.tableName}`)
    if (isError(records)) {
      console.error(records)
      return undefined
    }

    return records.rows as T[]
  }
}
