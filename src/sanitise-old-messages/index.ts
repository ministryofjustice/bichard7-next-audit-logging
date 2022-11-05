import { AuditLogApiClient, logger } from "src/shared"
import { isError } from "src/shared/types"
import { getApiConfig, getSanitiseConfig } from "./config"

export default async (): Promise<void> => {
  const apiConfig = getApiConfig()
  const config = getSanitiseConfig()

  const api = new AuditLogApiClient(apiConfig.API_URL, apiConfig.API_KEY)

  logger.debug("Fetching messages to sanitise")

  // Fetch the oldest unsanitised messages up to the limit
  const messages = await api.fetchUnsanitised({
    limit: config.MESSAGE_FETCH_BATCH_NUM,
    includeColumns: ["isSanitised", "nextSanitiseCheck", "version"]
  })

  if (isError(messages)) {
    logger.error({ message: "Unable to fetch messages from api, exiting", error: messages })
    return
  }

  // Call the sanitise endpoint for each message
  for (const message of messages) {
    const sanitiseResult = await api.sanitiseMessage(message.messageId)
    if (isError(sanitiseResult)) {
      logger.error({ message: "Unable to sanitise message", error: sanitiseResult, messageId: message.messageId })
    }
  }
}
