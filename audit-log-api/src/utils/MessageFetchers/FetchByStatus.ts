import IMessageFetcher from "src/types/IMessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchByStatus implements IMessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase, private status: string) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.fetchMessages.getByStatus(this.status)
  }
}
