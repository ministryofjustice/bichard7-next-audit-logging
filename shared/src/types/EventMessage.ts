import type MessageFormat from "./MessageFormat"

export default interface EventMessage {
  messageData: string
  messageFormat: MessageFormat
  messageType: string
  eventSourceArn: string
}
