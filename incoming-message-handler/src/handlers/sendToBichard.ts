import { isError, AuditLog, Result } from "shared"
import { createMqConfig } from "src/configs"
import ApplicationError from "src/errors/ApplicationError"
import MqGateway from "src/gateways/MqGateway"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  console.log(`Sending message ${event.messageId} to Bichard`)

  let result: Result<void>

  try {
    result = await sendMessageUseCase.send(event.messageXml)
  } catch (error) {
    console.log("An error occurred when sending the message")
    throw new ApplicationError(`Failed to connect to the URL: ${config.url}`, error)
  }

  if (isError(result)) {
    console.log("Result returned an error")
    throw result
  }

  console.log("Complete!")

  return event
}
