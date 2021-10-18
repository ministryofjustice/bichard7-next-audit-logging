import type { EventMessage, MessageFormat, AmazonMqEventSourceRecordEvent, JmsTextMessage } from "shared"

type Result = {
  messages: EventMessage[]
}

const getEventSourceQueueName = (message: JmsTextMessage): string => {
  return message.destination.physicalName.replace(".FAILURE", "")
}

export default (
  { messages, eventSourceArn }: AmazonMqEventSourceRecordEvent,
  messageFormat: MessageFormat
): Result => ({
  messages: messages.map((message) => ({
    messageData: message.data,
    messageFormat,
    eventSourceArn,
    eventSourceQueueName: getEventSourceQueueName(message)
  }))
})
