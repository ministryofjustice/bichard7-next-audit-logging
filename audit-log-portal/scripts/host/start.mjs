import lambdaProxy from "http-lambda-proxy"
import serverFactory from "restana"
import { localStackUrl, region } from "./config.mjs"
import { setupEnvironment } from "./environment.mjs"
import { getApiDetails, isApiRunning, launchApi } from "./api.mjs"
import { getFunctionArn, createFunction } from "./hostLambda.mjs"

// Make sure the local infrastructure is running
// Note: We need to move into the environment directory to allow the shell script to run properly.
// This will be done relative to the portal root directory.
setupEnvironment()

if (!(await isApiRunning())) {
  await launchApi()
}

const { apiId, stageName } = await getApiDetails()

const hostLambdaFunctionName = "portal"
if (!(await getFunctionArn(hostLambdaFunctionName))) {
  await createFunction(hostLambdaFunctionName, apiId, stageName)
}

const proxy = lambdaProxy({
  target: hostLambdaFunctionName,
  region,
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

const hostPort = 8080
server.start(hostPort).then(() => console.log(`Portal host proxy listening on port ${hostPort}`))
