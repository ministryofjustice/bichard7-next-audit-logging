/* eslint-disable no-console */
const { ConnectFailover, Channel } = require("stompit")
const LambdaInvoker = require("./LambdaInvoker")
const processMessage = require("./processMessage")

class MqSubscriber {
  constructor(config) {
    this.url = config.url
    this.options = {
      connect: {
        connectHeaders: {
          login: config.login,
          passcode: config.password,
          "heart-beat": "5000,5000"
        }
      }
    }
    if (/stomp\+ssl/.test(this.url)) {
      this.url = this.url.replace(/stomp\+ssl/g, "ssl")
    }
  }

  connect() {
    if (this.channel) {
      return
    }

    const { connectHeaders } = this.options.connect
    const connectionManager = new ConnectFailover()
    connectionManager.addServer({
      url: this.url,
      connectHeaders
    })

    this.channel = new Channel(connectionManager)
  }

  async subscribe(queueName, action) {
    this.connect()
    const headers = {
      destination: `/queue/${queueName}`
    }

    const ack = (message) => {
      this.channel.ack(message)
      this.channel.close()
      process.exit()
    }

    const nack = (message) => {
      this.channel.nack(message)
      this.channel.close()
      process.exit()
    }

    return this.channel.subscribe(headers, (error, message) =>
      action(error, message, {
        ack: () => ack(message),
        nack: () => nack(message)
      })
    )
  }

  subscribeToGeneralEventQueue() {
    const lambda = new LambdaInvoker({
      url: process.env.AWS_URL || "http://localhost:4566",
      region: process.env.STEP_FUNCTIONS_REGION || "us-east-1"
    })

    this.subscribe("GENERAL_EVENT_QUEUE", (error, message, operations) =>
      processMessage(error, message, operations, lambda)
    )
    console.log("Listening to GENERAL_EVENT_QUEUE")
  }
}

module.exports = MqSubscriber
