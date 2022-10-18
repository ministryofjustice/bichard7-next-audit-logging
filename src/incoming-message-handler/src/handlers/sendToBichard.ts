import type { AuditLog, SendToBichardOutput } from "shared-types"
import { isError } from "shared-types"
import { createMqConfig } from "../configs"
import MqGateway from "../gateways/MqGateway"
import SendMessageUseCase from "../use-cases/SendMessageUseCase"
import transformMessageXml from "../use-cases/transformMessageXml"

interface SendToBichardInput {
  auditLog: AuditLog
  messageXml: string
}

const config = createMqConfig()
const gateway = new MqGateway(config)
const sendMessageUseCase = new SendMessageUseCase(gateway)

export default async function sendToBichard({
  auditLog,
  messageXml
}: SendToBichardInput): Promise<SendToBichardOutput> {
  const transformedXml = transformMessageXml(auditLog, messageXml)
  const sentAt = new Date()
  const result = await sendMessageUseCase.send(transformedXml)

  if (isError(result)) {
    throw result
  }

  return { sentAt, auditLog }
}
