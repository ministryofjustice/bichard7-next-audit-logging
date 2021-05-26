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

const action = (error, message, operations) => {
  if (error) {
    console.log(error)
    operations.nack()
  } else {
    message.setEncoding("utf8")
    const payload = JSON.stringify({ eventSource: "aws:amq", eventSourceArn: "ARN", messages: [message.read()] })
    console.log("Payload: ", payload)
    lambda
      .invokeGeneralEventHandler(payload)
      .then((response) => {
        console.log("Lambda function response: ", response)
        operations.ack()
      })
      .catch((err) => {
        console.log(err)
        operations.nack()
      })
  }
}

listener.subscribe("GENERAL_EVENT_QUEUE", action)
console.log("Listening to GENERAL_EVENT_QUEUE")
