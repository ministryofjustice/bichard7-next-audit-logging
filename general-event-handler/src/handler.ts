import { parseGeneralEventLogItem } from "./types"
import transformGeneralEventLogItem from "./use-cases/transformGeneralEventLogItem"
import AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"

export default async (event: AmazonMqEventSourceRecordEvent): Promise<void> => {
  const { messages } = event

  if (!messages || messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  // TODO: Handle multiple messages with batching?
  const message = messages[0]
  const logItem = await parseGeneralEventLogItem(message)
  const auditLogEvent = transformGeneralEventLogItem(logItem)

  // TODO: Send the event to the API.
  console.log(`POST /messages/${logItem.logEvent.correlationID}/events`)
  console.log(JSON.stringify(auditLogEvent))
}
