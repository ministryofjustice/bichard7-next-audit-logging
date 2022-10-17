import type { BichardPostgresGateway } from "shared"
import type { PromiseResult } from "shared-types"

export default class DeleteArchivedErrorsUseCase {
  constructor(private readonly gateway: BichardPostgresGateway) {}

  call(messageId: string): PromiseResult<void> {
    return this.gateway.deleteArchivedErrors(messageId)
  }
}
