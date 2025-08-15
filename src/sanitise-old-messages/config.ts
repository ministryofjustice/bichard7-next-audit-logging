import type { SSM } from "aws-sdk"
import { isError } from "src/shared/types"

export type ApiConfig = {
  API_URL: string
  API_KEY: string
}

export type SanitiseOldMessagesConfig = {
  MESSAGE_FETCH_BATCH_NUM: number
}

export const getSanitiseConfig = (): SanitiseOldMessagesConfig => {
  const { SANITISE_AFTER_DAYS, CHECK_FREQUENCY_DAYS, MESSAGE_FETCH_BATCH_NUM } = process.env

  if (!SANITISE_AFTER_DAYS) {
    throw Error("SANITISE_AFTER_DAYS environment variable must have value.")
  }

  if (!CHECK_FREQUENCY_DAYS) {
    throw Error("CHECK_FREQUENCY_DAYS environment variable must have value.")
  }

  return {
    MESSAGE_FETCH_BATCH_NUM: MESSAGE_FETCH_BATCH_NUM ? parseInt(MESSAGE_FETCH_BATCH_NUM, 10) : 100
  }
}

let apiKey: string | undefined

export const getApiConfig = async (ssm: SSM): Promise<ApiConfig> => {
  const { API_URL, API_KEY_ARN } = process.env

  if (!API_KEY_ARN) {
    throw Error("API_KEY_ARN environment variable must have value.")
  }

  if (!API_URL) {
    throw Error("API_URL environment variable must have value.")
  }

  if (apiKey) {
    return { API_URL, API_KEY: apiKey }
  }

  const apiKeyResult = await ssm
    .getParameter({ Name: API_KEY_ARN, WithDecryption: true })
    .promise()
    .catch((error: Error) => error)

  if (isError(apiKeyResult)) {
    throw apiKeyResult
  }

  if (!apiKeyResult.Parameter?.Value) {
    throw Error("Couldn't retrieve API Key from SSM")
  }

  apiKey = apiKeyResult.Parameter.Value

  return { API_URL, API_KEY: apiKey }
}
