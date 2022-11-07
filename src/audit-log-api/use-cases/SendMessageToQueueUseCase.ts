import type { MqGatewayInterface, PromiseResult } from "src/shared/types"

export default class SendMessageToQueueUseCase {
  constructor(private mqGateway: MqGatewayInterface) {}

  send(queueName: string, message: string): PromiseResult<void> {
    return this.mqGateway.execute(message, queueName)
  }
}
