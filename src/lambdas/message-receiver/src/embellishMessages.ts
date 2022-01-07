import type { EventMessage, MessageFormat, AmazonMqEventSourceRecordEvent, JmsTextMessage } from "shared-types"

const getEventSourceQueueName = (message: JmsTextMessage): string => {
  return message.destination.physicalName.replace(".FAILURE", "")
}

export default (
  { messages, eventSourceArn }: AmazonMqEventSourceRecordEvent,
  messageFormat: MessageFormat
): EventMessage[] => {
  return messages.map((message) => ({
    messageData: message.data,
    messageFormat,
    eventSourceArn,
    eventSourceQueueName: getEventSourceQueueName(message)
  }))
}
