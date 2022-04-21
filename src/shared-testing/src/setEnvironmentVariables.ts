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
  process.env.S3_AWS_ACCESS_KEY_ID = "S3RVER"
  process.env.S3_AWS_SECRET_ACCESS_KEY = "S3RVER"
  process.env.DYNAMO_AWS_ACCESS_KEY_ID = "S3RVER"
  process.env.DYNAMO_AWS_SECRET_ACCESS_KEY = "S3RVER"
  process.env.BICHARD_DB_HOST = "localhost"
  process.env.BICHARD_DB_PORT = "5432"
  process.env.BICHARD_DB_USERNAME = "bichard"
  process.env.BICHARD_DB_PASSWORD = "password"

  if (additionalVariables) {
    Object.keys(additionalVariables).forEach((key) => {
      process.env[key] = additionalVariables[key]
    })
  }
}
