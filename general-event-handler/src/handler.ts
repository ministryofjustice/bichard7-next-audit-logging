import { isError } from "shared"
import { parseGeneralEventLogItem } from "./types"
import transformGeneralEventLogItem from "./use-cases/transformGeneralEventLogItem"
import AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"
import SendCreateEventRequestUseCase from "./use-cases/SendCreateEventRequestUseCase"

export default async (event: AmazonMqEventSourceRecordEvent): Promise<void> => {
  const { messages } = event

  if (!messages || messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    throw new Error("The API_URL environment variable has not been set")
  }

  // TODO: Handle multiple messages with batching?
  const message = messages[0]
  const logItem = await parseGeneralEventLogItem(message)
  const auditLogEvent = transformGeneralEventLogItem(logItem)

  const sendCreateEventRequest = new SendCreateEventRequestUseCase(apiUrl)
  const result = await sendCreateEventRequest.execute(logItem.logEvent.correlationID, auditLogEvent)

  if (isError(result)) {
    throw result
  }
}
