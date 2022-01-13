import type { KeyValuePair } from "shared-types"

export default (additionalVariables?: KeyValuePair<string, string>): void => {
  process.env.AWS_URL = "http://localhost:8000"
  process.env.AWS_REGION = "eu-west-2"
  process.env.S3_URL = "http://localhost:4569"
  process.env.S3_REGION = "eu-west-2"
  process.env.MQ_USER = "admin"
  process.env.MQ_PASSWORD = "admin"
  process.env.MQ_URL = "failover:(stomp://localhost:51613)"
  process.env.API_URL = "http://localhost:3010"
  process.env.API_KEY = "DUMMY"
  process.env.AWS_ACCESS_KEY_ID = 'S3RVER'
  process.env.AWS_SECRET_ACCESS_KEY = 'S3RVER'


  if (additionalVariables) {
    Object.keys(additionalVariables).forEach((key) => {
      process.env[key] = additionalVariables[key]
    })
  }
}
