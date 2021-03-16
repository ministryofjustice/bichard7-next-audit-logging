import { IncomingMessage } from "./entities"

export default async function readMessage(event: string): Promise<IncomingMessage> {
  console.log(event)

  await Promise.resolve()

  return undefined
}
