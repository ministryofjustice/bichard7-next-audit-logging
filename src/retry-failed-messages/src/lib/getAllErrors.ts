import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogApiClient } from "shared"

export default async function (apiClient: AuditLogApiClient) {
  let errors: AuditLog[] = []
  let lastMessageId: string | undefined

  while (true) {
    const errorBatch = await apiClient.getMessages({ status: "Error", lastMessageId })

    if (isError(errorBatch)) {
      return errorBatch
    }

    errors = errors.concat(errorBatch)
    if (errorBatch.length < 10) {
      return errors
    }
    lastMessageId = errorBatch[9].messageId
  }
}
