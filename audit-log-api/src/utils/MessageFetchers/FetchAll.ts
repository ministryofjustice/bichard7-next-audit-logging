import MessageFetcher from "src/types/MessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchAll implements MessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.fetchMessages.get()
  }
}
