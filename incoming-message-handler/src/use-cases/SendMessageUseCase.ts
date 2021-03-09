import { PromiseResult } from "@handlers/common"
import MqGateway from "../gateways/MqGateway"

export default class SendMessageUseCase {
  constructor(private gateway: MqGateway) {}

  send(messageBody: string): PromiseResult<void> {
    return this.gateway.execute(messageBody)
  }
}
