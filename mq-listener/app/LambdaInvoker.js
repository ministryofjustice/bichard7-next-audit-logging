const { Lambda } = require("aws-sdk")

class LambdaInvoker {
  constructor(config) {
    this.lambda = new Lambda({
      endpoint: config.url,
      region: config.region,
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test"
      }
    })
  }

  invokeGeneralEventHandler(payload) {
    const params = {
      FunctionName: "general-event-receiver",
      Payload: payload
    }

    return this.lambda.invoke(params).promise()
  }
}

module.exports = LambdaInvoker
