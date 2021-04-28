import { isError, AuditLog, Result } from "shared"
import { createMqConfig } from "src/configs"
import ApplicationError from "src/errors/ApplicationError"
import MqGateway from "src/gateways/MqGateway"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  let result: Result<void>

  try {
    result = await sendMessageUseCase.send(event.messageXml)
  } catch (error) {
    throw new ApplicationError(`Failed to connect to the URL: ${config.url}`, error)
  }

  if (isError(result)) {
    throw result
  }

  return event
}
