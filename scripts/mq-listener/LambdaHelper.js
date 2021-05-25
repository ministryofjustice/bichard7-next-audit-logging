const { Lambda } = require("aws-sdk")

class LambdaHelper {
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
      FunctionName: "GeneralEventHandler",
      Payload: payload
    }

    return this.lambda.invoke(params).promise()
  }
}

module.exports = LambdaHelper
