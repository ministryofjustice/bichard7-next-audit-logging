const { ConnectFailover, Channel } = require("stompit")

class MqHelper {
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
      destination: `/queue/${queueName}`,
      ack: "auto"
    }

    return this.channel.subscribe(headers, (error, message) => action(error, message, () => this.channel.ack(message)))
  }
}

module.exports = MqHelper
