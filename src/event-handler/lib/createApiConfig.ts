import type ApiConfig from "../types/ApiConfig"
import getConfigValue from "src/shared/utils/getConfigValue"
import type { SSMClient } from "@aws-sdk/client-ssm"

export default async function getConfig(ssm: SSMClient): Promise<ApiConfig> {
  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    throw Error("Missing required environment variable API_URL")
  }

  const apiKey = await getConfigValue(ssm, process.env.API_KEY, "api_key")
  if (!apiKey) {
    throw Error("Could not read API_KEY from configuration")
  }

  return { apiUrl, apiKey }
}
