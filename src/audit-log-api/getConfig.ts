import type { SSM } from "aws-sdk"
import getSSMParameter from "src/shared/utils/getSSMParameter"

const getConfig = async (ssm: SSM) => {
  const { API_URL, API_KEY_ARN } = process.env

  if (!API_URL) {
    throw new Error("API_URL environment variable is not set")
  }

  if (!API_KEY_ARN) {
    throw new Error("API_KEY_ARN environment variable is not set")
  }

  const apiKey = await getSSMParameter(ssm, API_KEY_ARN, "API key")

  if (apiKey.error) {
    throw apiKey.error
  }

  return {
    apiUrl: API_URL,
    apiKey: apiKey.value!
  }
}

export default getConfig
