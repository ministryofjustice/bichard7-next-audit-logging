import * as https from "https"
import axios, { AxiosError } from "axios"
import { PromiseResult } from "@handlers/common"
import { MqConfig } from "../src/types"

const getQueueUrl = (config: MqConfig): string =>
  `https://${config.MQ_USER}:${config.MQ_PASSWORD}@${config.MQ_HOST}:${config.MQ_PORT}/ibmmq/rest/v1/messaging/qmgr/${config.MQ_QUEUE_MANAGER}/queue/${config.MQ_QUEUE}`

const sendDeleteRequest = (url: string, httpsAgent: any): Promise<any> =>
  new Promise<any>((resolve, reject) => {
    axios
      .delete(url, {
        headers: {
          "ibm-mq-rest-csrf-token": "blank",
          "Content-Type": "text/plain;charset=utf-8"
        },
        httpsAgent
      })
      .then((response: any) => resolve(response))
      .catch((error: AxiosError) => reject(error))
  })

export class IbmMqService {
  private httpsAgent: any

  constructor(private config: MqConfig) {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })
  }

  async getMessage(): PromiseResult<any> {
    const url = `${getQueueUrl(this.config)}/message`
    const response = await sendDeleteRequest(url, this.httpsAgent)
    const body = response && response.data && response.data.body

    if (!body) {
      return new Error("Response received but no content")
    }

    return body
  }

  async clearQueue(): Promise<void> {
    const url = `${getQueueUrl(this.config)}/message`
    let response

    do {
      try {
        response = await sendDeleteRequest(url, this.httpsAgent)
      } catch (error) {
        return error
      }
    } while (!response || response.status !== 204)
  }
}
