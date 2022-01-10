import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import { createMqConfig } from "src/configs"
import MqGateway from "src/gateways/MqGateway"
import SendMessageUseCase from "src/use-cases/SendMessageUseCase"
import transformMessageXml from "src/use-cases/transformMessageXml"

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard(event: AuditLog): Promise<AuditLog> {
  const transformedXml = transformMessageXml(event)
  const result = await sendMessageUseCase.send(transformedXml)

  if (isError(result)) {
    throw result
  }

  return event
}
