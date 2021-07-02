import MessageFetcher from "src/types/MessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchById implements MessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase, private messageId: string) {}

  fetch(): PromiseResult<AuditLog> {
    return this.fetchMessages.getById(this.messageId)
  }
}
