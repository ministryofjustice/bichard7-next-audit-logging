import MqConfig from "./MqConfig"

export default (): MqConfig => {
  const { MQ_USER, MQ_PASSWORD, MQ_HOST, MQ_PORT, MQ_QUEUE } = process.env

  return {
    host: MQ_HOST,
    port: +MQ_PORT,
    username: MQ_USER,
    password: MQ_PASSWORD,
    queueName: MQ_QUEUE
  }
}
