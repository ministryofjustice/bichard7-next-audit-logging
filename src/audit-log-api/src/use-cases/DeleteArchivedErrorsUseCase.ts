import type { BichardPostgresGateway, PromiseResult } from "shared-types"
// import { isError } from "shared-types"

export default class DeleteArchivedErrorsUseCase {
  constructor(private readonly gateway: BichardPostgresGateway) {}

  call(messageId: string): PromiseResult<void> {
    return this.gateway.deleteArchivedErrors(messageId)
  }
}
