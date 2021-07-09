import type { MessageFormat } from "src/types"

export default interface EventMessage {
  messageData: string
  messageFormat: MessageFormat
}
