import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import PostgresGateway from "../PostgresGateway/PostgresGateway"

export default class BichardPostgresGateway extends PostgresGateway {
  async deleteArchivedErrors(messageId: string): PromiseResult<void> {
    const result = await this.query(`DELETE FROM br7own.archive_error_list WHERE message_id=$1`, [messageId])
    if (isError(result)) {
      return result
    }
  }

  async messageIsInErrorList(messageId: string): PromiseResult<boolean> {
    const result = await this.query(
      `SELECT 1
      FROM br7own.error_list
      WHERE message_id = $1`,
      [messageId]
    )

    if (isError(result)) {
      return result
    }

    return result.rowCount > 0
  }
}
