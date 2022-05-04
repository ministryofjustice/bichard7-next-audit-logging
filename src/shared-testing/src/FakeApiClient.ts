import type { ApiClient, AuditLog, AuditLogEvent, PromiseResult } from "shared-types"

export default class FakeApiClient implements ApiClient {
  private messages: AuditLog[] = []

  private error?: Error

  private errorFunctions: string[] = []

  private successfullCallsRemaining?: number

  private shouldFunctionReturnError(functionName: string): boolean {
    const isLimited = this.successfullCallsRemaining !== undefined
    const exceededLimit = this.successfullCallsRemaining !== undefined && this.successfullCallsRemaining < 1
    if (this.successfullCallsRemaining !== undefined) {
      this.successfullCallsRemaining--
    }

    return (
      (!!this.error &&
        !isLimited &&
        (this.errorFunctions.length === 0 || this.errorFunctions.includes(functionName))) ||
      exceededLimit
    )
  }

  getMessage(messageId: string): PromiseResult<AuditLog> {
    if (this.shouldFunctionReturnError("getMessage")) {
      return Promise.resolve(this.error!)
    }

    const message = this.messages.filter((x) => x.messageId === messageId)[0]
    return Promise.resolve(message ?? { events: [] })
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

  setErrorReturnedByFunctions(error: Error, functionNames?: string[]): void {
    this.error = error
    this.errorFunctions = functionNames || []
  }

  setErrorReturnedByFunctionsAfterNCalls(error: Error, calls: number, functionNames?: string[]): void {
    this.error = error
    this.errorFunctions = functionNames || []
    this.successfullCallsRemaining = calls
  }

  reset(messages?: AuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }

  addMessage(message: AuditLog): void {
    this.messages.push(message)
  }
}
