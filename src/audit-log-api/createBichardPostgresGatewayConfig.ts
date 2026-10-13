import type { PostgresConfig } from "src/shared/types"
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"

async function getPassword() {
  const ssm = new SSMClient({ region: process.env.AWS_REGION })

  const configPassword = process.env.DB_PASSWORD
  if (!configPassword) {
    console.log("No password specified, using placeholder")
    return "password"
  }

  if (!configPassword.startsWith("arn:aws:ssm")) {
    console.log("Using raw password from environment variable")
    return configPassword
  }

  const command = new GetParameterCommand({
    Name: configPassword,
    WithDecryption: true
  })

  const passwordResponse = await ssm.send(command)
  if (!passwordResponse.Parameter?.Value) {
    throw new Error("Failed to read password from SSM")
  }

  return passwordResponse.Parameter.Value
}

export default async function createBichardPostgresGatewayConfig(): Promise<PostgresConfig> {
  const { DB_HOST, DB_PORT, DB_USER, DB_NAME, DB_SCHEMA, DB_SSL } = process.env

  if (!DB_HOST) {
    throw Error("DB_HOST environment variable must have value.")
  }

  if (!DB_PORT) {
    throw Error("DB_PORT environment variable must have value.")
  }

  if (!DB_USER) {
    throw Error("DB_USER environment variable must have value.")
  }

  const dbSchema = DB_SCHEMA ?? "br7own"

  return {
    HOST: DB_HOST,
    PORT: parseInt(DB_PORT, 10),
    USERNAME: DB_USER,
    PASSWORD: await getPassword(),
    DATABASE_NAME: DB_NAME ?? "bichard",
    TABLE_NAME: dbSchema ? `${dbSchema}.archive_error_list` : "archive_error_list",
    SSL: DB_SSL === "true"
  }
}
