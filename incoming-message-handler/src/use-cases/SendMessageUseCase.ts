import { PromiseResult } from "shared"
import MqGateway from "src/gateways/MqGateway"

export default class SendMessageUseCase {
  constructor(private gateway: MqGateway) {}

  send(messageBody: string): PromiseResult<void> {
    return this.gateway.execute(messageBody)
  }
}
