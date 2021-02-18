import { SQSEvent } from "aws-lambda"
import MqGateway from "./gateways/MqGateway"
import { MqConfig } from "./types"

const env: MqConfig = {
  MQ_USER: process.env.MQ_USER,
  MQ_PASSWORD: process.env.MQ_PASSWORD,
  MQ_HOST: process.env.MQ_HOST,
  MQ_PORT: process.env.MQ_PORT,
  MQ_QUEUE_MANAGER: process.env.MQ_QUEUE_MANAGER,
  MQ_QUEUE: process.env.MQ_QUEUE
}

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  const gateway = new MqGateway(env)
  await Promise.all(
    event.Records.map(async (record) => {
      const response = await gateway.execute(JSON.stringify(record))

      if (response && response.status !== 201) {
        throw new Error(response.statusText)
      }
    })
  )
}
