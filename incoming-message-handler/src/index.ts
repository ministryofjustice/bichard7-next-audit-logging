import { SQSEvent, Context } from "aws-lambda"
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

export const sendMessage = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  console.info(`Received ${event.Records.length} records`)
  console.info(`From context ${context}`)
  const gateway = new MqGateway(env)
  await Promise.all(
    event.Records.map(async (record) => {
      const response = await gateway.execute(JSON.stringify(record))

      if (!response) {
        console.log("No response received")
      } else {
        console.log(`Response received: ${response.status}`)

        if (response.status !== 201) {
          throw new Error(response.statusText)
        }
      }
    })
  )

  console.log("Finished executing lambda")
}
