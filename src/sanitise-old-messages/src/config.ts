import type { Duration } from "date-fns"
import type { DynamoDbConfig, PostgresConfig } from "shared-types"

export type ApiConfig = {
  API_URL: string
  API_KEY: string
}

export type SanitiseOldMessagesConfig = {
  SANITISE_AFTER: Duration
  CHECK_FREQUENCY: Duration
}

export const getSanitiseConfig = (): SanitiseOldMessagesConfig => {
  const { SANITISE_AFTER_DAYS, CHECK_FREQUENCY: CHECK_FREQUENCY_DAYS } = process.env

  if (!SANITISE_AFTER_DAYS) {
    throw Error("SANITISE_AFTER_DAYS environment variable must have value.")
  }

  if (!CHECK_FREQUENCY_DAYS) {
    throw Error("CHECK_FREQUENCY_DAYS environment variable must have value.")
  }
  return {
    SANITISE_AFTER: { days: parseInt(SANITISE_AFTER_DAYS, 10) },
    CHECK_FREQUENCY: { days: parseInt(CHECK_FREQUENCY_DAYS, 10) }
  }
}

export const getPostgresConfig = () => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SCHEMA, DB_SSL } = process.env

  if (!DB_HOST) {
    throw Error("DB_HOST environment variable must have value.")
  }

  if (!DB_PORT) {
    throw Error("DB_PORT environment variable must have value.")
  }

  if (!DB_USER) {
    throw Error("DB_USER environment variable must have value.")
  }

  if (!DB_PASSWORD) {
    throw Error("DB_PASSWORD environment variable must have value.")
  }

  if (!DB_NAME) {
    throw Error("DB_NAME environment variable must have value.")
  }

  const config: PostgresConfig = {
    HOST: DB_HOST,
    PORT: parseInt(DB_PORT, 10),
    USERNAME: DB_USER,
    PASSWORD: DB_PASSWORD,
    DATABASE_NAME: DB_NAME,
    TABLE_NAME: DB_SCHEMA ? `${DB_SCHEMA}.archive_error_list` : "archive_error_list",
    SSL: DB_SSL === "true"
  }

  return config
}

export const getDynamoConfig = () => {
  const { AWS_URL, AWS_REGION, AUDIT_LOG_TABLE_NAME, DYNAMO_AWS_ACCESS_KEY_ID, DYNAMO_AWS_SECRET_ACCESS_KEY } =
    process.env

  if (!AWS_URL) {
    throw Error("AWS_URL environment variable must have value.")
  }

  if (!AWS_REGION) {
    throw Error("AWS_REGION environment variable must have value.")
  }

  if (!AUDIT_LOG_TABLE_NAME) {
    throw Error("AUDIT_LOG_TABLE_NAME environment variable must have value.")
  }

  const config: DynamoDbConfig = {
    DYNAMO_URL: AWS_URL,
    DYNAMO_REGION: AWS_REGION,
    TABLE_NAME: AUDIT_LOG_TABLE_NAME
  }

  if (DYNAMO_AWS_ACCESS_KEY_ID) {
    config.AWS_ACCESS_KEY_ID = DYNAMO_AWS_ACCESS_KEY_ID
  }

  if (DYNAMO_AWS_SECRET_ACCESS_KEY) {
    config.AWS_SECRET_ACCESS_KEY = DYNAMO_AWS_SECRET_ACCESS_KEY
  }
  return config
}

export const getApiConfig = (): ApiConfig => {
  const { API_URL, API_KEY } = process.env

  if (!API_URL) {
    throw Error("API_URL environment variable must have value.")
  }

  if (!API_KEY) {
    throw Error("API_KEY environment variable must have value.")
  }

  return {
    API_URL,
    API_KEY
  } as ApiConfig
}

