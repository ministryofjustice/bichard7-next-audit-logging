import path, { dirname } from "path"
import { fileURLToPath } from "url"
import shell from "shelljs"
import lambdaProxy from "http-lambda-proxy"
import serverFactory from "restana"

import { LambdaClient, GetFunctionCommand, CreateFunctionCommand } from "@aws-sdk/client-lambda"
import { APIGatewayClient, GetRestApisCommand, GetStagesCommand } from "@aws-sdk/client-api-gateway"

const modulePath = dirname(fileURLToPath(import.meta.url))
const localStackUrl = process.env.LOCALSTACK_URL || "http://localhost:4566"
const localStackInternalUrl = process.env.LOCALSTACK_INTERNAL_URL || "http://localstack_main:4566"

// Make sure the local infrastructure is running
// Note: We need to move into the environment directory to allow the shell script to run properly.
// This will be done relative to the portal root directory.
process.chdir("../environment")

const envSetupFilePath = path.resolve(modulePath, "../../environment/setup.sh")
const { stdout } = shell.exec(envSetupFilePath)
console.log(stdout)

// Get the ID and Stage Name for the Audit Log API
const apiGatewayClient = new APIGatewayClient({
  endpoint: localStackUrl,
  region: "us-east-1"
})

const getRestApisCommand = new GetRestApisCommand({})
const restApisResult = await apiGatewayClient.send(getRestApisCommand)
const restApis = (restApisResult && restApisResult.items) || []

const auditLogApi = restApis.find((api) => api.name === "AuditLogApi")
if (!auditLogApi) {
  console.error("The Audit Log API is not running")
  process.exit(1)
}

const getStagesCommand = new GetStagesCommand({
  restApiId: auditLogApi.id
})

const stagesResult = await apiGatewayClient.send(getStagesCommand)
const stages = (stagesResult && stagesResult.item) || []
const stageName = stages.length === 0 ? undefined : stages[0].stageName

if (!stageName) {
  console.error("Failed to find a Stage for the Audit Log API")
  process.exit(1)
}

// Create a local lambda in the infrastructure
const lambdaClient = new LambdaClient({
  endpoint: localStackUrl,
  region: "us-east-1"
})

const getFunctionArn = async (functionName) => {
  const command = new GetFunctionCommand({
    FunctionName: functionName
  })

  try {
    const result = await lambdaClient.send(command)
    console.log(`Function ARN = ${result.Configuration.FunctionArn}`)
    return result && result.Configuration && result.Configuration.FunctionArn
  } catch (error) {
    // The error is likely because the function does not exist
    // We could check for the returned httpStatusCode 404 here
    return undefined
  }
}

const createFunction = async (functionName, apiId, stageName) => {
  const command = new CreateFunctionCommand({
    FunctionName: functionName,
    Code: {
      S3Bucket: "__local__",
      S3Key: path.resolve(modulePath, "..")
    },
    Handler: "host.handler",
    Runtime: "nodejs12.x",
    Role: "whatever",
    Timeout: 10,
    Environment: {
      Variables: {
        NEXT_PUBLIC_API_URL: `${localStackInternalUrl}/restapis/${apiId}/${stageName}/_user_request_`
      }
    }
  })

  const result = await lambdaClient.send(command)
  const lambdaArn = result && result.FunctionArn

  if (!lambdaArn) {
    console.error("Failed to create the Lambda Function")
    process.exit(1)
  }

  return lambdaArn
}

const lambdaArn = (await getFunctionArn("portal")) || (await createFunction("portal", auditLogApi.id, stageName))
console.log(`Lambda ARN: ${lambdaArn}`)

const proxy = lambdaProxy({
  target: "portal",
  region: "us-east-1",
  endpoint: localStackUrl
})

const server = serverFactory()
server.all("/*", (request, response) => {
  // Add in a custom header to the request to prevent the AWS infrastructure from
  // modifying the content type on the response to gzip
  // See: https://stackoverflow.com/a/48217379/308012
  const newRequest = {
    ...request,
    headers: {
      ...request.headers,
      "Accept-Encoding": "identity"
    }
  }

  proxy(newRequest, response, request.url, {})
})

server.start(8080).then(() => console.log("Portal host proxy listening on port 8080"))
