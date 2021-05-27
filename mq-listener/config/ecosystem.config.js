module.exports = {
  apps: [
    {
      name: "mq-listener",
      script: "./app/start.js",
      log_date_format: "YYYY-MM-DD HH:mm:ss.SSS",
      env_e2e: {
        AWS_URL: "http://localhost:4566",
        LAMBDA_REGION: "us-east-1",
        MQ_URL: "failover:(stomp://localhost:61613)",
        MQ_USER: "admin",
        MQ_PASSWORD: "admin"
      }
    }
  ]
}
