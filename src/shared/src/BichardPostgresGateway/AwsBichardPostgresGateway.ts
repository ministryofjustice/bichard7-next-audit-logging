import type { BichardPostgresGateway, PromiseResult } from "shared-types"
import PostgresGateway from "src/PostgresGateway/PostgresGateway"

export default class AwsBichardPostgresGateway extends PostgresGateway implements BichardPostgresGateway {
  async deleteArchivedErrors(messageId: string): PromiseResult<void> {
    await this.query(`DELETE FROM archive_error_list WHERE message_id='${messageId}'`)
  }
}
