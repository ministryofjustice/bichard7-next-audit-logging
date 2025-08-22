import type { SSM } from "aws-sdk"
import { isError } from "src/shared/types"

const getSSMParameter = async (ssm: SSM, paramName: string, paramDescription: string): Promise<string> => {
  const result = await ssm
    .getParameter({ Name: paramName, WithDecryption: true })
    .promise()
    .catch((error: Error) => error)

  if (isError(result)) {
    throw result
  }

  const value = result.Parameter?.Value

  if (!value) {
    throw Error(`Could't retrieve ${paramDescription} from SSM`)
  }

  return value
}

export default async (ssm: SSM) => {
  if (!process.env.API_URL) {
    throw new Error("API_URL environment variable is not set")
  }
  if (!process.env.API_KEY_ARN) {
    throw new Error("API_KEY_ARN environment variable is not set")
  }
  if (!process.env.DB_HOST) {
    throw new Error("DB_HOST environment variable is not set")
  }
  if (!process.env.DB_USER) {
    throw new Error("DB_USER environment variable is not set")
  }
  if (!process.env.DB_PASSWORD_ARN) {
    throw new Error("DB_PASSWORD_ARN environment variable is not set")
  }
  if (!process.env.DB_NAME) {
    throw new Error("DB_NAME environment variable is not set")
  }

  const apiKey = await getSSMParameter(ssm, process.env.API_KEY_ARN, "API key")
  const dbPassword = await getSSMParameter(ssm, process.env.DB_PASSWORD_ARN, "DB password")

  return {
    apiUrl: process.env.API_URL,
    apiKey,
    dbHost: process.env.DB_HOST,
    dbPort: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    dbUser: process.env.DB_USER,
    dbPassword,
    dbSsl: !!process.env.DB_SSL,
    dbName: process.env.DB_NAME,
    dbSchema: process.env.DB_SCHEMA || "br7own",
    archiveGroupLimit: parseInt(process.env.ARCHIVE_GROUP_LIMIT || "100")
  }
}
