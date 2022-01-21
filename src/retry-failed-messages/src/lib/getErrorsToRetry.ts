import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogApiClient } from "shared"
import shouldRetry from "./shouldRetry"

export default async function (apiClient: AuditLogApiClient, errorCount: number): PromiseResult<AuditLog[]> {
  let errors: AuditLog[] = []
  let lastMessageId: string | undefined

  while (errors.length < errorCount) {
    const errorBatch = await apiClient.getMessages({ status: "Error", lastMessageId })

    if (isError(errorBatch)) {
      return errorBatch
    }

    const errorsToRetry = errorBatch.filter((e) => shouldRetry(e))

    errors = errors.concat(errorsToRetry)
    if (errors.length >= errorCount) {
      errors = errors.slice(0, errorCount)
      return errors
    }
    if (errorBatch.length < 10) {
      return errors
    }
    lastMessageId = errorBatch[9].messageId
  }
  return errors
}
