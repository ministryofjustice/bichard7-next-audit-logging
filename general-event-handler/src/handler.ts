import GeneralEventLogItem from "./types/GeneralEventLogItem"

interface AmazonMqEventSourceRecordEvent {
  eventSource: string
  eventSourceArn: string
  messages: string[]
}

export default (event: AmazonMqEventSourceRecordEvent): void => {
  const { messages } = event

  if (!messages || messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  const message = messages[0]
  const eventLogItem = new GeneralEventLogItem(message)
  console.log(eventLogItem.xml)
}
