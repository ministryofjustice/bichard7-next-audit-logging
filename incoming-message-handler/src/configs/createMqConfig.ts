import MqConfig from "./MqConfig"

export default (): MqConfig => {
  const { MQ_USER, MQ_PASSWORD, MQ_URL, MQ_QUEUE } = process.env

  return {
    url: MQ_URL,
    username: MQ_USER,
    password: MQ_PASSWORD,
    queueName: MQ_QUEUE
  }
}
