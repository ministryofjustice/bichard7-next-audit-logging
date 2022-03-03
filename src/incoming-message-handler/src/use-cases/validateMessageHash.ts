import type { ApiClient } from "shared-types"
import { isError } from "shared-types"
import type { ValidationResult } from "src/handlers/storeMessage"

interface ValidateMessageHashResult {
  messageHashValidationResult: ValidationResult
}

export default async (hash: string, apiClient: ApiClient): Promise<ValidateMessageHashResult | undefined> => {
  const message = await apiClient.getMessageByHash(hash)

  if (message && !isError(message)) {
    return {
      messageHashValidationResult: {
        isValid: false,
        message: `There is a message with the same hash in the database (${hash})`
      }
    }
  }

  return undefined
}
