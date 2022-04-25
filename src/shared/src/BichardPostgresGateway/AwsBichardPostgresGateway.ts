import type { BichardPostgresGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import PostgresGateway from "../PostgresGateway/PostgresGateway"

export default class AwsBichardPostgresGateway extends PostgresGateway implements BichardPostgresGateway {
  async deleteArchivedErrors(messageId: string): PromiseResult<void> {
    const result = await this.query(`DELETE FROM ${this.tableName} WHERE message_id=$1`, [messageId])
    if (isError(result)) {
      return result
    }
  }
}
