import type { MqGateway } from "@bichard/mq"
import type { PromiseResult } from "shared"

export default class SendMessageToQueueUseCase {
  constructor(private mqGateway: MqGateway) {}

  send(queueName: string, message: string): PromiseResult<void> {
    return this.mqGateway.execute(message, queueName)
  }
}
