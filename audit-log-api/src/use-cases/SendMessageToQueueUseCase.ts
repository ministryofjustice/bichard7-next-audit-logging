import type { MqGateway } from "@bichard/mq"
import type { PromiseResult } from "shared"
import { decodeBase64 } from "shared"

export default class SendMessageToQueueUseCase {
  constructor(private mqGateway: MqGateway) {}

  send(queueName: string, message: string): PromiseResult<void> {
    const decodedMessage = decodeBase64(message)
    return this.mqGateway.execute(decodedMessage, queueName)
  }
}
