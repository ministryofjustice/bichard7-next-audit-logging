import MessageFetcher from "src/types/MessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchByStatus implements MessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase, private status: string) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.fetchMessages.getByStatus(this.status)
  }
}
