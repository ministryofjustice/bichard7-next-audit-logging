import { isError, AuditLog } from "shared"
import { createMqConfig } from "src/configs"
import MqGateway from "src/gateways/MqGateway"
import replaceMessageIdInXml from "src/use-cases/replaceMessageIdInXml"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  const transformedXml = replaceMessageIdInXml(event)
  const result = await sendMessageUseCase.send(transformedXml)

  if (isError(result)) {
    throw result
  }

  return event
}
