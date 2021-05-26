const MqSubscriber = require("./MqSubscriber")

const subscriber = new MqSubscriber({
  url: process.env.MQ_URL || "failover:(stomp://localhost:61613)",
  login: process.env.MQ_USER || "admin",
  password: process.env.MQ_PASSWORD || "admin"
})

subscriber.subscribeToGeneralEventHandler()
