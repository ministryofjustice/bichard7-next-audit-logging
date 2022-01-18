import { isError } from "shared-types"
import getAllErrors from "./lib/getAllErrors"
import config from "./config"
import { AuditLogApiClient } from "shared"
import shouldRetry from "./lib/shouldRetry"
const apiClient = new AuditLogApiClient(config.apiUrl, config.apiKey)

type OutputType = { retried: string[]; errored: string[] }

export default async (): Promise<OutputType> => {
  const messages = await getAllErrors(apiClient)
  const output: OutputType = { retried: [], errored: [] }

  if (isError(messages)) {
    throw messages
  }

  // filter by max retry attempts
  const messagesToRetry = messages.filter(
    (m) => !m.retryCount || (Number.isInteger(m.retryCount) && m.retryCount < config.maxRetryAttempts)
  )

  // call retry api endpoint for remaining messages
  for (const message of messagesToRetry) {
    if (shouldRetry(message)) {
      console.log(`Retrying message [${message.messageId}]`)
      const result = await apiClient.retryEvent(message.messageId)
      console.log(result)
      if (isError(result)) {
        output.errored.push(message.messageId)
      } else {
        output.retried.push(message.messageId)
      }
    }
  }
  return output
}
