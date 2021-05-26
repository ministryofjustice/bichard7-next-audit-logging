/* eslint-disable no-console */
const processMessage = (error, message, operations, lambda) => {
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

module.exports = processMessage
