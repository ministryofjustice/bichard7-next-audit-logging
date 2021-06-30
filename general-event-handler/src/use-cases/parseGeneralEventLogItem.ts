import { parseXml, PromiseResult } from "shared"
import { GeneralEventLogItem, EventDetails } from "src/types"

export default async (xml: string): PromiseResult<EventDetails> => {
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  const event = logItem.logEvent || logItem.auditEvent

  if (!event) {
    throw Error("The XML must contain a logItem or auditEvent element at the root.")
  }

  if (!event.eventType) {
    throw Error("eventType must have value.")
  }

  if (!event.componentID) {
    throw Error("componentID must have value.")
  }

  if (!event.correlationID) {
    throw Error("correlationID must have value.")
  }

  if (!event.eventDateTime) {
    throw Error("eventDateTime must have value.")
  }

  return event
}
