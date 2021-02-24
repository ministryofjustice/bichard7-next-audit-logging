import { MqConfig } from "../types"

// eslint-disable-next-line import/prefer-default-export
export const createMqConfig = (): MqConfig => {
  const { MQ_USER, MQ_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE_MANAGER, MQ_QUEUE } = process.env
  const config: MqConfig = {
    MQ_USER,
    MQ_PASSWORD,
    MQ_HOST,
    MQ_PORT,
    MQ_QUEUE_MANAGER,
    MQ_QUEUE
  }
  return config
}
