import { PromiseResult } from "@handlers/common"
import { MqConfig } from "src/configs"
import { post } from "src/utils/api"

class MqGateway {
  private URL: string

  constructor(config: MqConfig) {
    const { MQ_USER, MQ_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE_MANAGER, MQ_QUEUE } = config
    this.URL = `https://${MQ_USER}:${MQ_PASSWORD}@${MQ_HOST}:${MQ_PORT}/ibmmq/rest/v2/messaging/qmgr/${MQ_QUEUE_MANAGER}/queue/${MQ_QUEUE}/message`
  }

  async execute(message: string): PromiseResult<void> {
    return post(this.URL, message)
  }
}

export default MqGateway
