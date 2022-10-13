import type { PromiseResult } from "./Result"

export default interface BichardPostgresGateway {
  deleteArchivedErrors(messageId: string): PromiseResult<void>
  messageIsInErrorList(messageId: string): PromiseResult<boolean>
}
