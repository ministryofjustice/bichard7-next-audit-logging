import { isError, PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"

export default class FetchMessagesUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  async get(): PromiseResult<AuditLog[]> {
    const result = await this.gateway.fetchMany()

    if (isError(result)) {
      return new Error("Results not found")
    }

    return result
  }
}
