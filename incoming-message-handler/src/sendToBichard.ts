import { IncomingMessage } from "./entities"

export default function sendToBichard(event: IncomingMessage): Promise<void> {
  console.log(event)

  return Promise.resolve()
}
