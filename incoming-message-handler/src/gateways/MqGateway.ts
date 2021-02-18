import axios, { AxiosError } from "axios"
import * as https from "https"
import { PromiseResult } from "@handlers/common"
import { MqConfig } from "../types"

class MqGateway {
  private URL: string

  constructor(env: MqConfig) {
    this.URL = `https://${env.MQ_USER}:${env.MQ_PASSWORD}@${env.MQ_HOST}:${env.MQ_PORT}/ibmmq/rest/v2/messaging/qmgr/${env.MQ_QUEUE_MANAGER}/queue/${env.MQ_QUEUE}/message`
  }

  async execute(message: string): PromiseResult<void> {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })

    return axios
      .post(this.URL, message, {
        headers: {
          "ibm-mq-rest-csrf-token": "blank",
          "Content-Type": "text/plain;charset=utf-8"
        },
        httpsAgent
      })
      .then(() => undefined)
      .catch((error: AxiosError) => error)
  }
}

export default MqGateway
