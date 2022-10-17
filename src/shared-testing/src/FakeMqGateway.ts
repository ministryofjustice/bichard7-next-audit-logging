import type { MqGatewayInterface, PromiseResult } from "shared-types"

export default class FakeMqGateway implements MqGatewayInterface {
  private error?: Error

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  execute(message: string, queueName: string): PromiseResult<void> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  dispose(): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(): void {
    this.error = undefined
  }
}
