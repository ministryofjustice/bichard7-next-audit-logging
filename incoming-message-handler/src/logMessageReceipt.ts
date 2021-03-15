import { IncomingMessage } from "./entities"

export default async function logMessageReceipt(event: IncomingMessage): Promise<IncomingMessage> {
  await Promise.resolve()

  return event
}
