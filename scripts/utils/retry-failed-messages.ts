import { AuditLogApiClient, logger } from "../../src/shared"
import { isError } from "../../src/shared-types/src"
import config from "../../src/retry-failed-messages/src/config"
import getErrorsToRetry from "../../src/retry-failed-messages/src/lib/getErrorsToRetry"

const apiClient = new AuditLogApiClient(config.apiUrl, config.apiKey)

//type OutputType = { retried: string[]; errored: string[] }

const retryMessages = async () => {
  const messages = await getErrorsToRetry(apiClient, 200)
  //const output: OutputType = { retried: [], errored: [] }

  if (isError(messages)) {
    throw messages
  }

  // call retry api endpoint for remaining messages
  logger.info(`Retrying ${messages.length} messages`)
  for (const message of messages) {
    logger.info(`Retrying message [${message.messageId}]`)
   // const result = await apiClient.retryEvent(message.messageId)
   // if (isError(result)) {
   //   output.errored.push(message.messageId)
   // } else {
   //   output.retried.push(message.messageId)
   // }
  }
}

retryMessages()
