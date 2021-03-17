import { isError } from "@handlers/common"
import { IncomingMessage, ReceivedMessage } from "src/entities"
import readMessage from "src/use-cases/readMessage"

export default async function parseMessage(event: ReceivedMessage): Promise<IncomingMessage> {
  const incomingMessage = await readMessage(event)

  if (isError(incomingMessage)) {
    throw incomingMessage
  }

  return incomingMessage
}
