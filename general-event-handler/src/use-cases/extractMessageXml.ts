import type { Result } from "shared"
import { decodeBase64 } from "shared"
import type JmsTextMessage from "src/types/JmsTextMessage"

export default (message: JmsTextMessage): Result<string> => {
  if (!message || !message.data) {
    return new Error("The message does not contain a data property")
  }

  // The data property contains base64 encoded XML
  return decodeBase64(message.data)
}
