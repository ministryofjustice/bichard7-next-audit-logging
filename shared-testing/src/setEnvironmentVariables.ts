import type { KeyValuePair } from "shared-types"

export default (additionalVariables?: KeyValuePair<string, string>): void => {
  process.env.AWS_URL = "http://localhost:4566"
  process.env.AWS_REGION = "us-east-1"
  process.env.S3_URL = "http://localhost:4566"
  process.env.S3_REGION = "us-east-1"
  process.env.MQ_USER = "admin"
  process.env.MQ_PASSWORD = "admin"
  process.env.MQ_URL = "failover:(stomp://localhost:51613)"

  if (additionalVariables) {
    Object.keys(additionalVariables).forEach((key) => {
      process.env[key] = additionalVariables[key]
    })
  }
}
