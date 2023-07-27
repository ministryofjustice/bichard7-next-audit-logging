import type { PostgresConfig } from "src/shared/types"

export default function createBichardPostgresGatewayConfig(): PostgresConfig {
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

  const dbSchema = DB_SCHEMA ?? "br7own"

  const config: PostgresConfig = {
    HOST: DB_HOST,
    PORT: parseInt(DB_PORT, 10),
    USERNAME: DB_USER,
    PASSWORD: DB_PASSWORD,
    DATABASE_NAME: DB_NAME ?? "bichard",
    TABLE_NAME: dbSchema ? `${dbSchema}.archive_error_list` : "archive_error_list",
    SSL: DB_SSL === "true"
  }

  return config
}
