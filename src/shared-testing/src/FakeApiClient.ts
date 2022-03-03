import type { AuditLog, AuditLogEvent, PromiseResult, ApiClient } from "shared-types"

export default class FakeApiClient implements ApiClient {
  private messages: AuditLog[] = []

  private error?: Error

  private errorFunctions: string[] = []

  private shouldFunctionReturnError(functionName: string): boolean {
    return !!this.error && (this.errorFunctions.length === 0 || this.errorFunctions.includes(functionName))
  }

  getMessage(messageId: string): PromiseResult<AuditLog> {
    if (this.shouldFunctionReturnError("getMessage")) {
      return Promise.resolve(this.error!)
    }

    const message = this.messages.filter((x) => x.messageId === messageId)[0]
    return Promise.resolve(message)
  }

  getMessageByHash(hash: string): PromiseResult<AuditLog> {
    if (this.shouldFunctionReturnError("getMessageByHash")) {
      return Promise.resolve(this.error!)
    }

    const message = this.messages.filter((x) => x.messageHash === hash)[0]
    return Promise.resolve(message)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    if (this.shouldFunctionReturnError("createAuditLog")) {
      return Promise.resolve(this.error!)
    }

    return Promise.resolve()
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (this.shouldFunctionReturnError("createEvent")) {
      return Promise.resolve(this.error!)
    }

    return Promise.resolve()
  }

  shouldReturnError(error: Error, functionNames?: string[]): void {
    this.error = error
    this.errorFunctions = functionNames || []
  }

  reset(messages?: AuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }
}
