import { PromiseResult } from "@handlers/common"
import { MessageData } from "../types"
import MqGateway from "../gateways/MqGateway"

export default class SendMessageUseCase {
  constructor(private gateway: MqGateway) {}

  send(message: MessageData): PromiseResult<void> {
    return this.gateway.execute(message.rawXml)
  }
}
