import path, { dirname } from "path"
import { fileURLToPath } from "url"
import shell from "shelljs"

import { LambdaClient, GetFunctionCommand, CreateFunctionCommand } from "@aws-sdk/client-lambda"

const modulePath = dirname(fileURLToPath(import.meta.url))
const localStackUrl = process.env.LOCALSTACK_URL || "http://localhost:4566"

// Make sure the local infrastructure is running
// Note: We need to move into the environment directory to allow the shell script to run properly.
// This will be done relative to the portal root directory.
process.chdir("../environment")

const envSetupFilePath = path.resolve(modulePath, "../../environment/setup.sh")
const { stdout } = shell.exec(envSetupFilePath)
console.log(stdout)

// Create a local lambda in the infrastructure
const client = new LambdaClient({
  endpoint: localStackUrl,
  region: "us-east-1"
})

const getFunctionArn = async (functionName) => {
  const command = new GetFunctionCommand({
    FunctionName: functionName
  })

  const result = await client.send(command)
  return result && result.Configuration && result.Configuration.FunctionArn
}

const createFunction = async (functionName) => {
  const command = new CreateFunctionCommand({
    FunctionName: functionName,
    Code: {
      S3Bucket: "__local__",
      S3Key: path.resolve(modulePath, "..")
    },
    Handler: "host.handler",
    Runtime: "nodejs12.x",
    Role: "whatever"
  })

  const result = await client.send(command)
  const lambdaArn = result && result.FunctionArn

  if (!lambdaArn) {
    console.error("Failed to create the Lambda Function")
    process.exit(1)
  }

  return lambdaArn
}

const lambdaArn = (await getFunctionArn("portal")) || (await createFunction("portal"))
console.log(`Lambda ARN: ${lambdaArn}`)

// Configure express.js as a proxy server
