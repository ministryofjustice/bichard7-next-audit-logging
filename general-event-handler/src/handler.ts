import { isError } from "shared"
import transformGeneralEventLogItem from "./use-cases/transformGeneralEventLogItem"
import SendCreateEventRequestUseCase from "./use-cases/SendCreateEventRequestUseCase"
import parseGeneralEventLogItem from "./use-cases/parseGeneralEventLogItem"
import type { AmazonMqEventSourceRecordEvent } from "./types"
import extractMessageXml from "./use-cases/extractMessageXml"

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
  // See: https://dsdmoj.atlassian.net/browse/BICAWS-794
  const message = messages[0]
  const xml = extractMessageXml(message)
  if (isError(xml)) {
    throw xml
  }

  const parseResult = await parseGeneralEventLogItem(xml)
  if (isError(parseResult)) {
    throw parseResult
  }

  const auditLogEvent = transformGeneralEventLogItem(parseResult)

  const sendCreateEventRequest = new SendCreateEventRequestUseCase(apiUrl)
  const result = await sendCreateEventRequest.execute(parseResult.correlationID, auditLogEvent)

  if (isError(result)) {
    throw result
  }
}
