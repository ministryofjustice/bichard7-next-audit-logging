import { Client } from "pg"
import { AuditLogApiClient, AwsAuditLogDynamoGateway, logger } from "shared"
import sanitiseOldMessages from "./sanitiseOldMessages"

export default async (): Promise<void> => {
  logger.info("Sanitise Old Messages lambda not implemented")

  // TODO get config values from environment variables

  const api = new AuditLogApiClient("http://localhost:3010", "apiKey")
  const dynamo = new AwsAuditLogDynamoGateway(
    {
      DYNAMO_URL: "http://localhost:8000",
      DYNAMO_REGION: "eu-west-2",
      TABLE_NAME: "auditLogTable",
      AWS_ACCESS_KEY_ID: "DUMMY",
      AWS_SECRET_ACCESS_KEY: "DUMMY"
    },
    "auditLogTable"
  )
  const db = new Client({
    host: "localhost",
    port: 5432,
    user: "bichard",
    password: "password",
    ssl: false,
    database: "bichard"
  })
  await db.connect()

  await sanitiseOldMessages(api, dynamo, db)

  await db.end()
}
