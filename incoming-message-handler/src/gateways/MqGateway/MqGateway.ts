import { Client, connect, ConnectFailover } from "stompit"
import { isError, PromiseResult } from "shared"
import { MqConfig } from "src/configs"

export default class MqGateway {
  private readonly url: string

  private readonly options: any

  private client: Client

  constructor(private readonly config: MqConfig) {
    this.url = config.url
    this.options = {
      connect: {
        connectHeaders: {
          login: config.username,
          passcode: config.password,
          "heart-beat": "5000,5000"
        }
      }
    }

    if (/stomp\+ssl/.test(this.url)) {
      this.url = this.url.replace(/stomp\+ssl/g, "ssl")
    }
  }

  private connectAsync(): PromiseResult<Client> {
    return new Promise((resolve, reject) => {
      const listener: connect.ConnectionListener = (error: Error, client: Client) => {
        if (error) {
          reject(error)
        } else {
          resolve(client)
        }
      }

      const connectionManager = new ConnectFailover(this.url, this.options)
      connectionManager.connect(listener)
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

    const result = this.sendMessage(client, message)
      .then(() => undefined)
      .catch((error: Error) => error)

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
      this.client.disconnect((error: Error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
