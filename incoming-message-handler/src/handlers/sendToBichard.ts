import { isError, AuditLog } from "shared"
import { createMqConfig } from "src/configs"
import ApplicationError from "src/errors/ApplicationError"
import MqGateway from "src/gateways/MqGateway"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  const result = await sendMessageUseCase.send(event.messageXml)

  if (isError(result)) {
    throw new ApplicationError(`Failed to connect to the URL: ${config.url}`, result)
  }

  return event
}
