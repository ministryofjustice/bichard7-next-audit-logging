import type { PostgresConfig } from "shared-types"

export default function createBichardPostgresGatewayConfig(): PostgresConfig {
  const { BICHARD_DB_HOST, BICHARD_DB_PORT, BICHARD_DB_USERNAME, BICHARD_DB_PASSWORD } = process.env

  if (!BICHARD_DB_HOST) {
    throw Error("BICHARD_DB_HOST environment variable must have value.")
  }

  if (!BICHARD_DB_PORT) {
    throw Error("BICHARD_DB_PORT environment variable must have value.")
  }

  if (!BICHARD_DB_USERNAME) {
    throw Error("BICHARD_DB_USERNAME environment variable must have value.")
  }

  if (!BICHARD_DB_PASSWORD) {
    throw Error("BICHARD_DB_PASSWORD environment variable must have value.")
  }

  const config: PostgresConfig = {
    HOST: BICHARD_DB_HOST,
    PORT: parseInt(BICHARD_DB_PORT, 10),
    USERNAME: BICHARD_DB_USERNAME,
    PASSWORD: BICHARD_DB_PASSWORD,
    DATABASE_NAME: "bichard",
    TABLE_NAME: "br7own.archive_error_list"
  }

  return config
}
