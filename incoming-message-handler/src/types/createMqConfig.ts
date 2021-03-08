import MqConfig from "./MqConfig"

const createMqConfig = (): MqConfig => {
  const { MQ_USER, MQ_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE_MANAGER, MQ_QUEUE } = process.env
  return {
    MQ_USER,
    MQ_PASSWORD,
    MQ_HOST,
    MQ_PORT,
    MQ_QUEUE_MANAGER,
    MQ_QUEUE
  }
}

export default createMqConfig
