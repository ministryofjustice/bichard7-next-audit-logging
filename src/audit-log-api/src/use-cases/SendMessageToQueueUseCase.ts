import type { PromiseResult, MqGateway } from "shared-types"

export default class SendMessageToQueueUseCase {
  constructor(private mqGateway: MqGateway) {}

  send(queueName: string, message: string): PromiseResult<void> {
    return this.mqGateway.execute(message, queueName)
  }
}
