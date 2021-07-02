import IMessageFetcher from "src/types/IMessageFetcher"
import { FetchMessagesUseCase } from "src/use-cases"
import { PromiseResult, AuditLog } from "shared"

export default class FetchByExternalCorrelationId implements IMessageFetcher {
  constructor(private fetchMessages: FetchMessagesUseCase, private externalCorrelationId: string) {}

  fetch(): PromiseResult<AuditLog | null> {
    return this.fetchMessages.getByExternalCorrelationId(this.externalCorrelationId)
  }
}
