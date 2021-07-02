import IMessageFetcher from "src/types/IMessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchAll implements IMessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.fetchMessages.get()
  }
}
