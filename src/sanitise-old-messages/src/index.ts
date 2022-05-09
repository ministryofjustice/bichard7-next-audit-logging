import { Client } from "pg"
import { AuditLogApiClient, AwsAuditLogDynamoGateway, logger } from "shared"
import { getApiConfig, getDynamoConfig, getPostgresConfig } from "./config"
import sanitiseOldMessages from "./sanitiseOldMessages"

export default async (): Promise<void> => {
  const pgConfig = getPostgresConfig()
  const dynamoConfig = getDynamoConfig()
  const apiConfig = getApiConfig()

  const api = new AuditLogApiClient(apiConfig.API_URL, apiConfig.API_KEY)
  const dynamo = new AwsAuditLogDynamoGateway(dynamoConfig, dynamoConfig.TABLE_NAME)
  const db = new Client({
    host: pgConfig.HOST,
    port: pgConfig.PORT,
    user: pgConfig.USERNAME,
    password: pgConfig.PASSWORD,
    ssl: pgConfig.SSL
      ? {
          rejectUnauthorized: false
        }
      : false,
    database: pgConfig.DATABASE_NAME
  })

  try {
    await db.connect()
    await sanitiseOldMessages(api, dynamo, db)
  } catch (error) {
    logger.error(error as Error)
  } finally {
    await db.end()
  }
}
