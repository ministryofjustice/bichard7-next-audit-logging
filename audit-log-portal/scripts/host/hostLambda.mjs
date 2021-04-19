import path from "path"
import { LambdaClient, GetFunctionCommand, CreateFunctionCommand } from "@aws-sdk/client-lambda"
import modulePath from "./modulePath.mjs"
import { localStackUrl, localStackInternalUrl, region } from "./config.mjs"

// Create a local lambda in the infrastructure
const lambdaClient = new LambdaClient({
  endpoint: localStackUrl,
  region
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
      S3Key: path.resolve(modulePath, "../..")
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
    throw new Error("Failed to create the Lambda Function")
  }

  return lambdaArn
}

export { getFunctionArn, createFunction }
