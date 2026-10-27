import type { MqConfig } from "src/shared/types"
import type { SSMClient } from "@aws-sdk/client-ssm"
import getConfigValue from "src/shared/utils/getConfigValue"

export default async function (ssm: SSMClient): Promise<MqConfig> {
  const { MQ_USER, MQ_PASSWORD, MQ_URL } = process.env

  if (!MQ_USER || !MQ_PASSWORD || !MQ_URL) {
    throw Error("MQ environment variables must all have value.")
  }

  return {
    url: MQ_URL,
    username: await getConfigValue(ssm, MQ_USER, ""),
    password: await getConfigValue(ssm, MQ_PASSWORD, "")
  }
}
