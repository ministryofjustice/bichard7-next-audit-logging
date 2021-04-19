import path from "path"
import shell from "shelljs"
import { APIGatewayClient, GetRestApisCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway"
import { localStackUrl, region } from "./config.mjs"
import modulePath from "./modulePath.mjs"

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

  return restApis.find((api) => api.name === apiName)
}

const getApiDetails = async () => {
  const auditLogApi = await getApi()
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

const isApiRunning = async () => {
  const auditLogApi = await getApi()
  return !!auditLogApi
}

const launchApi = async () => {
  // Move the path to the Audit Log API root directory
  process.chdir(modulePath)
  process.chdir("../../../audit-log-api")

  const launchApiScriptPath = path.resolve(modulePath, "../../../audit-log-api/scripts/deploy-infrastructure.sh")
  const { stdout } = shell.exec(launchApiScriptPath)
  console.log(stdout)
}

export { getApiDetails, isApiRunning, launchApi }
