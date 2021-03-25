import * as https from "https"
import axios, { AxiosError, AxiosResponse } from "axios"
import { Poller } from "shared"
import { MqConfig } from "src/configs"

const getQueueUrl = (config: MqConfig): string =>
  `https://${config.MQ_USER}:${config.MQ_PASSWORD}@${config.MQ_HOST}:${config.MQ_PORT}/ibmmq/rest/v1/messaging/qmgr/${config.MQ_QUEUE_MANAGER}/queue/${config.MQ_QUEUE}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendDeleteRequest = (url: string, httpsAgent: any): Promise<AxiosResponse> =>
  new Promise<AxiosResponse>((resolve, reject) => {
    axios
      .delete(url, {
        headers: {
          "ibm-mq-rest-csrf-token": "blank",
          "Content-Type": "text/plain;charset=utf-8"
        },
        httpsAgent
      })
      .then((response: AxiosResponse) => resolve(response))
      .catch((error: AxiosError) => reject(error))
  })

export default class IbmMqService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly httpsAgent: any

  constructor(private readonly config: MqConfig) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })
  }

  pollForMessage(timeout: number): Promise<string> {
    const poller = new Poller(() => this.getMessage())

    return poller.poll(timeout)
  }

  async getMessage(): Promise<string | undefined> {
    const url = `${getQueueUrl(this.config)}/message`
    const response = await sendDeleteRequest(url, this.httpsAgent)
    const content = response && response.data

    if (content && typeof content !== "string") {
      throw new Error("Response received but no discernible content")
    }

    return content
  }

  async clearQueue(): Promise<void> {
    const url = `${getQueueUrl(this.config)}/message`
    let response

    do {
      // eslint-disable-next-line no-await-in-loop
      response = await sendDeleteRequest(url, this.httpsAgent)
    } while (!response || response.status !== 204)
  }
}
