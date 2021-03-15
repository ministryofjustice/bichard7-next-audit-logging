import { createMqConfig } from "./configs"
import { IncomingMessage } from "./entities"
import MqGateway from "./gateways/MqGateway"
import SendMessageUseCase from "./use-cases/SendMessageUseCase"

const gateway = new MqGateway(createMqConfig())
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: IncomingMessage): Promise<void> {
  await sendMessageUseCase.send(event.originalMessageXml)
}
