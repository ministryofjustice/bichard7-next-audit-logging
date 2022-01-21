import { isError } from "shared-types"
import getErrorsToRetry from "./lib/getErrorsToRetry"
import config from "./config"
import { AuditLogApiClient } from "shared"
const apiClient = new AuditLogApiClient(config.apiUrl, config.apiKey)

type OutputType = { retried: string[]; errored: string[] }

export default async (): Promise<OutputType> => {
  console.log("Fetching messages to retry")
  const messages = await getErrorsToRetry(apiClient, config.errorsToRetry)
  const output: OutputType = { retried: [], errored: [] }

  if (isError(messages)) {
    throw messages
  }

  // call retry api endpoint for remaining messages
  console.log(`Retrying ${messages.length} messages`)
  for (const message of messages) {
    console.log(`Retrying message [${message.messageId}]`)
    const result = await apiClient.retryEvent(message.messageId)
    if (isError(result)) {
      output.errored.push(message.messageId)
    } else {
      output.retried.push(message.messageId)
    }
  }
  return output
}
