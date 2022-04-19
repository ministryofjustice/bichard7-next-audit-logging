import type { BichardPostgresGateway, PostgresConfig, PromiseResult } from "shared-types"

export default class AwsBichardPostgresGateway implements BichardPostgresGateway {
  constructor(config: PostgresConfig) {
    console.log(config)
  }

  async deleteArchivedErrors(messageId: string): PromiseResult<void> {
    console.log(messageId)
  }
}
