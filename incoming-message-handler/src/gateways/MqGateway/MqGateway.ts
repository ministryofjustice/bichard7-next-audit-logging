import { Client, connect, ConnectFailover } from "stompit"
import { isError, PromiseResult } from "shared"
import { MqConfig } from "src/configs"

interface ConnectionOptions {
  host: string
  port: number
  ssl: boolean
}

export function parseConnectionOptions(url: string): ConnectionOptions {
  const protocolPosition = url.indexOf("://")
  const protocol = url.substring(0, protocolPosition)

  const portPosition = url.lastIndexOf(":")
  const port = +url.substring(portPosition + 1)

  const host = url.substring(protocolPosition + 3, portPosition)

  return {
    host,
    port,
    ssl: /ssl/.test(protocol)
  }
}

export function deconstructServers(config: MqConfig): connect.ConnectOptions[] {
  const connectHeaders: connect.ConnectHeaders = {
    login: config.username,
    passcode: config.password,
    "heart-beat": "5000,5000"
  }

  let { url } = config
  if (/^failover:\(.*\)$/.test(url)) {
    // Remove the failover:() wrapper
    url = url.substring("failover:(".length)
    url = url.substring(0, url.length - 1)
  }

  const servers = url.split(",")
  return servers.map((serverUrl) => {
    const options = parseConnectionOptions(serverUrl)

    return {
      host: options.host,
      port: options.port,
      connectHeaders,
      ssl: true, // options.ssl,
      timeout: 10000
    }
  })
}

export default class MqGateway {
  private readonly connectionOptions: connect.ConnectOptions[]

  private readonly reconnectOptions: ConnectFailover.ConnectFailoverOptions

  private client: Client

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
      const listener: connect.ConnectionListener = (error: Error, client: Client) => {
        if (error) {
          reject(error)
        } else {
          resolve(client)
        }
      }

      const connectionManager = new ConnectFailover(this.connectionOptions, this.reconnectOptions)
      connectionManager.on("error", (error) => {
        console.log("!!! AN ERROR OCCURRED WHILE TRYING TO CONNECT !!!")
        console.error(error)
      })
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
