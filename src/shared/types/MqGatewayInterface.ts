import type { PromiseResult } from "."

export default interface MqGatewayInterface {
  execute(message: string, queueName: string): PromiseResult<void>
  dispose(): PromiseResult<void>
}
