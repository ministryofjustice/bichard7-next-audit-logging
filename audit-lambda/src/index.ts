import { SQSEvent } from "aws-lambda"
import MqGateway from "./gateways/mq-gateway"
import { MqConfig } from "./types"

const env: MqConfig = {
  MQ_USER: process.env.MQ_USER,
  MQ_PASSWORD: process.env.MQ_PASSWORD,
  MQ_HOST: process.env.MQ_HOST,
  MQ_PORT: process.env.MQ_PORT,
  MQ_QUEUE_MANAGER: process.env.MQ_QUEUE_MANAGER,
  MQ_QUEUE: process.env.MQ_QUEUE
}

export const sendMessage = async (event: SQSEvent): Promise<void> => {
  console.info(`Received ${event.Records.length} records`)

  const gateway = new MqGateway(env)
  await Promise.all(event.Records.map(async (record) => {
    const response = await gateway.execute(JSON.stringify(record))

    if (!response) {
      console.log("+++ NO RESPONSE +++")
    }
    else {
      console.log(response.status)
    }
  }))

  console.log("Finished executing lambda")
}
