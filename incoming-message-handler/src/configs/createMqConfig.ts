import MqConfig from "./MqConfig"

export default (): MqConfig => {
  const { MQ_USER, MQ_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE } = process.env

  return new MqConfig(MQ_HOST, +MQ_PORT, MQ_USER, MQ_PASSWORD, MQ_QUEUE)
}
