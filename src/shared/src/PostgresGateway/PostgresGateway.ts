import type { QueryResult } from "pg"
import { Client } from "pg"
import type { PostgresConfig, PromiseResult } from "shared-types"

export default class PostgresGateway {
  private readonly client: Client

  protected tableName: string

  constructor(config: PostgresConfig) {
    this.client = new Client({
      host: config.HOST,
      port: config.PORT,
      user: config.USERNAME,
      password: config.PASSWORD,
      database: config.DATABASE_NAME,
      ssl: config.SSL ? { rejectUnauthorized: false } : false
    })

    if (config.TABLE_NAME) {
      this.tableName = config.TABLE_NAME
    }
  }

  protected async getClient(): PromiseResult<Client> {
    if (!this.tableName) {
      return Error("Table name is mandatory.")
    }

    await this.client.connect().catch((error) => error)
    return this.client
  }

  protected async query<T>(command: string, values: unknown[] = []): PromiseResult<QueryResult<T>> {
    await this.getClient()
    return this.client.query(command, values).catch((error) => error)
  }

  async dispose() {
    await this.client.end()
  }
}
