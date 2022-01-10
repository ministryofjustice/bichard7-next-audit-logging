import type { PromiseResult } from "."

export default interface MqGateway {
  execute(message: string, queueName: string): PromiseResult<void>
  dispose(): PromiseResult<void>
}
