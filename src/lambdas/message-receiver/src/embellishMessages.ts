import type { EventMessage, MessageFormat } from "shared"
import type AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"

export default ({ messages }: AmazonMqEventSourceRecordEvent, messageFormat: MessageFormat): EventMessage[] =>
  messages.map((message) => ({
    messageData: message.data,
    messageFormat
  }))
