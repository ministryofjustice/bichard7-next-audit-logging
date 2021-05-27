const MqSubscriber = require("./MqSubscriber")
const LambdaInvoker = require("./LambdaInvoker")

const lambda = new LambdaInvoker({
  url: process.env.AWS_URL,
  region: process.env.LAMBDA_REGION
})

const subscriber = new MqSubscriber({
  url: process.env.MQ_URL,
  login: process.env.MQ_USER,
  password: process.env.MQ_PASSWORD
})

subscriber.subscribeToGeneralEventQueue(lambda)
