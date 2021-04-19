import { APIGatewayClient, GetRestApisCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway"
import { localStackUrl, region } from "./config.mjs"

const apiName = "AuditLogApi"

// Get the ID and Stage Name for the Audit Log API
const apiGatewayClient = new APIGatewayClient({
  endpoint: localStackUrl,
  region
})

const getApi = async () => {
  const getRestApisCommand = new GetRestApisCommand({})
  const restApisResult = await apiGatewayClient.send(getRestApisCommand)
  const restApis = (restApisResult && restApisResult.items) || []

  const auditLogApi = restApis.find((api) => api.name === apiName)
  if (!auditLogApi) {
    throw new Error("The Audit Log API is not running")
  }

  const getStagesCommand = new GetStagesCommand({
    restApiId: auditLogApi.id
  })

  const stagesResult = await apiGatewayClient.send(getStagesCommand)
  const stages = (stagesResult && stagesResult.item) || []
  const stageName = stages.length === 0 ? undefined : stages[0].stageName

  if (!stageName) {
    throw new Error("Failed to find a Stage for the Audit Log API")
  }

  return {
    apiId: auditLogApi.id,
    stageName
  }
}

export { getApi }
