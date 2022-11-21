/*
 *
 * This script checks message(s) for errors
 *
 * To check one message:
 * WORKSPACE={WORKSPACE} MESSAGE_ID={MESSAGE_ID} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/check-records-status.ts
 *
 * To check multiple messages using source file (each line in the file is a message ID):
 * WORKSPACE={WORKSPACE} SOURCE_FILE={SOURCE_FILE_PATH} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/check-records-status.ts
 *
 */

import fs from "fs"
import { AuditLogDynamoGateway } from "../../src/audit-log-api/src/gateways/dynamo"
import CalculateMessageStatusUseCase from "../../src/audit-log-api/src/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import { isError } from "../../src/shared-types/src"
import { Lambda } from "../../src/shared/node_modules/aws-sdk"

const { SOURCE_FILE, MESSAGE_ID, WORKSPACE } = process.env
if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}
if ((!SOURCE_FILE && !MESSAGE_ID) || (SOURCE_FILE && MESSAGE_ID)) {
  console.error("Either SOURCE_FILE or MESSAGE_ID environments variable must have value")
  process.exit(1)
}

const messageIds = MESSAGE_ID
  ? [MESSAGE_ID.trim()]
  : fs
      .readFileSync(SOURCE_FILE!)
      .toString()
      .split("\n")
      .filter((x) => !!x?.trim())

const dynamoConfig = {
  region: "eu-west-2",
  auditLogTableName: "Will be retrieved from Retry Message lambda environment variable",
  endpoint: "Will be retrieved from Retry Message lambda environment variable"
}

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get MQ connection details")
  }

  dynamoConfig.endpoint = retryLambda.Configuration?.Environment?.Variables?.AWS_URL || ""
  if (!dynamoConfig.endpoint) {
    throw Error("Couldn't get DynamoDB URL")
  }

  dynamoConfig.auditLogTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_TABLE_NAME || ""
  if (!dynamoConfig.auditLogTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }
}

const dynamo = new AuditLogDynamoGateway(dynamoConfig)

async function run() {
  let totalProcessing = 0
  let totalError = 0
  let totalComplete = 0

  for (const id of messageIds) {
    const result = await dynamo.fetchOne(id)

    if (isError(result)) {
      throw result
    }

    const status = new CalculateMessageStatusUseCase(result.events).call()
    totalProcessing += status === "Processing" ? 1 : 0
    totalError += status === "Error" ? 1 : 0
    totalComplete += status === "Complete" ? 1 : 0

    if (status === "Error") {
      console.log(`Error status: ${id}`)
      continue
    }
  }

  console.log("\nTotal messages:", messageIds.length)
  console.log("Processing:", totalProcessing)
  console.log("Error:", totalError)
  console.log("Complete:", totalComplete)
}

async function start() {
  await setup()
  await run()
}

start()
