import type { EventMessage, MessageFormat, AmazonMqEventSourceRecordEvent } from "shared"

export default ({ messages }: AmazonMqEventSourceRecordEvent, messageFormat: MessageFormat): EventMessage[] =>
  messages.map((message) => ({
    messageData: message.data,
    messageFormat
  }))
