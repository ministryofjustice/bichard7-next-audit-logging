const MqSubscriber = require("./MqSubscriber")
const LambdaInvoker = require("./LambdaInvoker")

const lambda = new LambdaInvoker({
  url: process.env.AWS_URL || "http://localhost:4566",
  region: process.env.LAMBDA_REGION || "us-east-1"
})

const subscriber = new MqSubscriber({
  url: process.env.MQ_URL || "failover:(stomp://localhost:61613)",
  login: process.env.MQ_USER || "admin",
  password: process.env.MQ_PASSWORD || "admin"
})

subscriber.subscribeToGeneralEventQueue(lambda)
