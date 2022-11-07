import type { BichardPostgresGateway } from "src/shared"
import type { PromiseResult } from "src/shared/types"

export default class DeleteArchivedErrorsUseCase {
  constructor(private readonly gateway: BichardPostgresGateway) {}

  call(messageId: string): PromiseResult<void> {
    return this.gateway.deleteArchivedErrors(messageId)
  }
}
