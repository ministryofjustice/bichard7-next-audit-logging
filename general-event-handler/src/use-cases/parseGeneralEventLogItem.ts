import { parseXml, PromiseResult } from "shared"
import { GeneralEventLogItem } from "src/types"

export default async (xml: string): PromiseResult<GeneralEventLogItem> => {
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  const { logEvent } = logItem

  if (!logEvent) {
    throw Error("logEvent must have value.")
  }

  if (!logEvent.eventType) {
    throw Error("eventType must have value.")
  }

  if (!logEvent.componentID) {
    throw Error("componentID must have value.")
  }

  if (!logEvent.correlationID) {
    throw Error("correlationID must have value.")
  }

  if (!logEvent.eventDateTime) {
    throw Error("eventDateTime must have value.")
  }

  return logItem
}
