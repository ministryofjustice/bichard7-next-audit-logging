import type MessageFormat from "./MessageFormat"

export default interface EventMessage {
  messageData: string
  messageFormat: MessageFormat
  eventSourceArn: string
  eventSourceQueueName: string
}
