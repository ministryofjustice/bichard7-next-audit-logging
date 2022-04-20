import type { QueryResult } from "pg"
import { Client } from "pg"
import type { PostgresConfig, PromiseResult } from "shared-types"

export default class PostgresGateway {
  private readonly client: Client

  constructor(config: PostgresConfig) {
    this.client = new Client({
      host: config.HOST,
      port: 5432,
      user: config.USERNAME,
      password: config.PASSWORD
    })
  }

  protected async getClient(): PromiseResult<Client> {
    await this.client.connect().catch((error) => error)
    return this.client
  }

  async dispose() {
    await this.client.end()
  }

  protected async query<T>(command: string, values: unknown[] = []): PromiseResult<QueryResult<T>> {
    await this.getClient()
    return this.client.query(command, values).catch((error) => error)
  }
}
