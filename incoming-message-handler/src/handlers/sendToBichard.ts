import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import { createMqConfig } from "../configs"
import MqGateway from "../gateways/MqGateway"
import SendMessageUseCase from "../use-cases/SendMessageUseCase"
import transformMessageXml from "../use-cases/transformMessageXml"

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
