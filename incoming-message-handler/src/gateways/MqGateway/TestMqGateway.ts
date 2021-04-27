import { isError, PromiseResult } from "shared"
import { Client } from "stompit"
import MqGateway from "./MqGateway"

const readMessage = (message: Client.Message): PromiseResult<string> => {
  return new Promise<string>((resolve, reject) => {
    message.readString("utf-8", (error: Error, buffer?: string) => {
      if (error) {
        reject(error)
      } else if (!buffer) {
        reject(new Error("No buffer returned for message"))
      } else {
        resolve(buffer)
      }
    })
  })
}

const getMessage = (client: Client, queueName: string): Promise<Client.Message> => {
  const headers = {
    destination: queueName
  }

  return new Promise<Client.Message>((resolve, reject) => {
    const callback: Client.MessageCallback = (error: Error, message: Client.Message) => {
      if (error) {
        console.error(error)
        reject(error)
      } else {
        resolve(message)
      }
    }

    client.subscribe(headers, callback)
  })
}

export default class TestMqGateway extends MqGateway {
  async getMessage(queueName: string): PromiseResult<string> {
    const client = await this.connectIfRequired()

    if (isError(client)) {
      return client
    }

    try {
      const message = await getMessage(client, queueName)
      return await readMessage(message)
    } catch (error) {
      return <Error>error
    }
  }
}
