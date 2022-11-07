import type { PromiseResult } from "src/shared/types"
import type MqGateway from "../gateways/MqGateway"

export default class SendMessageUseCase {
  constructor(private gateway: MqGateway) {}

  send(messageBody: string): PromiseResult<void> {
    return this.gateway.execute(messageBody)
  }
}
