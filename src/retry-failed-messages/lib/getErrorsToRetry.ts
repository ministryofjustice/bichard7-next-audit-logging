import type { AuditLogApiClient } from "src/shared"
import type { OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import shouldRetry from "./shouldRetry"

export default async function (
  apiClient: AuditLogApiClient,
  config: { maxRetryAttempts: number; initialRetryDelay: number; retryDelay: number; errorsToRetry: number }
): PromiseResult<OutputApiAuditLog[]> {
  const errorCount = config.errorsToRetry

  let errors: OutputApiAuditLog[] = []
  let lastMessageId: string | undefined

  while (errors.length < errorCount) {
    const errorBatch = await apiClient.getMessages({ status: "Error", lastMessageId, limit: 50, largeObjects: false })

    if (isError(errorBatch)) {
      return errorBatch
    }
    if (errorBatch.length === 0) {
      return errors
    }

    const errorsToRetry = errorBatch.filter((e) => shouldRetry(config, e))

    errors = errors.concat(errorsToRetry)
    if (errors.length >= errorCount) {
      errors = errors.slice(0, errorCount)
      return errors
    }
    lastMessageId = errorBatch[errorBatch.length - 1].messageId
  }
  return errors
}
