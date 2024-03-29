import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { Client, connect } from "stompit"
import { ConnectFailover } from "stompit"
import type { MqConfig } from "../../configs"
import deconstructServers from "./deconstructServers"

export default class MqGateway {
  private readonly connectionOptions: connect.ConnectOptions[]

  private readonly reconnectOptions: ConnectFailover.ConnectFailoverOptions

  private client: Client | null

  constructor(private readonly config: MqConfig) {
    this.connectionOptions = deconstructServers(config)

    this.reconnectOptions = {
      initialReconnectDelay: 1000,
      maxReconnectDelay: 3000,
      maxReconnects: 2,
      useExponentialBackOff: false
    }
  }

  private connectAsync(): PromiseResult<Client> {
    return new Promise((resolve, reject) => {
      const connectionManager = new ConnectFailover(this.connectionOptions, this.reconnectOptions)
      connectionManager.connect((error: Error | null, client: Client) => {
        if (error) {
          reject(error)
        } else {
          resolve(client)
        }
      })
    })
  }

  protected async connectIfRequired(): PromiseResult<Client> {
    if (!this.client) {
      const connectionResult = await this.connectAsync()

      if (isError(connectionResult)) {
        return connectionResult
      }

      this.client = connectionResult
    }

    return this.client
  }

  async execute(message: string): PromiseResult<void> {
    const client = await this.connectIfRequired()

    if (isError(client)) {
      return client
    }

    const result = await this.sendMessage(client, message)
      .then(() => undefined)
      .catch((error: Error) => error)

    await this.dispose()

    return result
  }

  private sendMessage(client: Client, message: string): Promise<void> {
    const headers = {
      destination: `/queue/${this.config.queueName}`
    }

    return new Promise<void>((resolve, reject) => {
      const options: Client.SendOptions = {
        onReceipt: () => resolve(),
        onError: (error: Error) => reject(error)
      }

      const writable = client.send(headers, options)

      writable.write(message)
      writable.end()
    })
  }

  async dispose(): PromiseResult<void> {
    if (!this.client) {
      return undefined
    }

    const disconnectionResult = await this.disconnectAsync().catch((error: Error) => error)

    if (!isError(disconnectionResult)) {
      this.client = null
    }

    return disconnectionResult
  }

  private disconnectAsync(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client?.disconnect((error: Error | null) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
