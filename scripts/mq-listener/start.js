const MqHelper = require("./MqHelper")
const LambdaHelper = require("./LambdaHelper")

const listener = new MqHelper({
  url: process.env.MQ_URL || "failover:(stomp://localhost:61613)",
  login: process.env.MQ_USER || "admin",
  password: process.env.MQ_PASSWORD || "admin"
})

const lambda = new LambdaHelper({
  url: process.env.AWS_URL || "http://localhost:4566",
  region: process.env.STEP_FUNCTIONS_REGION || "us-east-1"
})

const action = (error, message, ack) => {
  if (error) {
    console.log(error)
  } else {
    message.setEncoding("utf8")
    const payload = JSON.stringify({ eventSource: "aws:amq", eventSourceArn: "ARN", messages: [message.read()] })
    lambda
      .invokeGeneralEventHandler(payload)
      .then(() => ack())
      .catch((err) => console.log(err))
  }
}

listener.subscribe("GENERAL_EVENT_QUEUE", action)
console.log("Listening to GENERAL_EVENT_QUEUE")
