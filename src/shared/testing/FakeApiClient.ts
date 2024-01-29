import type { ApiAuditLogEvent, ApiClient, InputApiAuditLog, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import type { GetMessageOptions, GetMessagesOptions } from "../types/ApiClient"

export default class FakeApiClient implements ApiClient {
  private messages: InputApiAuditLog[] = []

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

  getMessage(messageId: string): PromiseResult<OutputApiAuditLog> {
    if (this.shouldFunctionReturnError("getMessage")) {
      return Promise.resolve(this.error!)
    }

    const message = this.messages.filter((x) => x.messageId === messageId)[0]
    return Promise.resolve((message ?? { events: [] }) as OutputApiAuditLog)
  }

  getMessageByHash(messageHash: string): PromiseResult<OutputApiAuditLog> {
    if (this.shouldFunctionReturnError("getMessageByHash")) {
      return Promise.resolve(this.error!)
    }

    const message = this.messages.filter((x) => x.messageHash === messageHash)[0]
    return Promise.resolve((message ?? { events: [] }) as OutputApiAuditLog)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createAuditLog(auditLog: InputApiAuditLog): PromiseResult<OutputApiAuditLog> {
    if (this.shouldFunctionReturnError("createAuditLog")) {
      return Promise.resolve(this.error!)
    }

    return Promise.resolve(auditLog as OutputApiAuditLog)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createEvent(messageId: string, event: ApiAuditLogEvent): PromiseResult<void> {
    if (this.shouldFunctionReturnError("createEvent")) {
      return Promise.resolve(this.error!)
    }

    return Promise.resolve()
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createUserEvent(userName: string, event: ApiAuditLogEvent): PromiseResult<void> {
    if (this.shouldFunctionReturnError("createUserEvent")) {
      return Promise.resolve(this.error!)
    }

    return Promise.resolve()
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sanitiseMessage(messageId: string): PromiseResult<void> {
    return Promise.resolve(Error("sanitiseMessage not implemented"))
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

  reset(messages?: InputApiAuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }

  addMessage(message: InputApiAuditLog): void {
    this.messages.push(message)
  }

  getMessages(_?: GetMessagesOptions): PromiseResult<OutputApiAuditLog[]> {
    return Promise.resolve(new Error("Unimplemented"))
  }

  retryEvent(_: string): PromiseResult<void> {
    return Promise.resolve(new Error("Unimplemented"))
  }

  fetchUnsanitised(_?: GetMessageOptions | undefined): PromiseResult<OutputApiAuditLog[]> {
    return Promise.resolve(new Error("Unimplemented"))
  }
}
