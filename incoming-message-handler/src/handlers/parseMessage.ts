import { isError } from "@handlers/common"
import { IncomingMessage } from "../entities"
import readMessage from "../use-cases/readMessage"

export default async function parseMessage(event: string): Promise<IncomingMessage> {
  const incomingMessage = await readMessage(event)

  if (isError(incomingMessage)) {
    throw incomingMessage
  }

  return incomingMessage
}
