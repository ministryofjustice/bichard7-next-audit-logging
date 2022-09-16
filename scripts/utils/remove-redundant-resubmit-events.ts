/*
 *
 * Use this script if there are too many repeated resubmission events in an audit log record and
 * the record has reached 400KB size. (DynamoDB record limit)
 *
 * This script removes all events from a message that have the following event source:
 *  - 'ResubmitFailedPNCMessages'
 *
 * To check and remove events for 1 message:
 * WORKSPACE={WORKSPACE} MESSAGE_ID={MESSAGE_ID} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/remove-redundant-resubmit-events.ts
 *
 * To check and remove events for multiple messages using source file (each line in the file is a message ID):
 * WORKSPACE={WORKSPACE} SOURCE_FILE={SOURCE_FILE_PATH} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/remove-redundant-resubmit-events.ts
 *
 */

import { Lambda } from "../../src/shared/node_modules/aws-sdk"
import { AwsAuditLogDynamoGateway } from "../../src/shared/src/AuditLogDynamoGateway"
import { isError } from "../../src/shared-types/src"
import fs from "fs"

const { SOURCE_FILE, MESSAGE_ID, WORKSPACE } = process.env
if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}
if ((!SOURCE_FILE && !MESSAGE_ID) || (SOURCE_FILE && MESSAGE_ID)) {
  console.error("Either SOURCE_FILE or MESSAGE_ID environment variable must have value")
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
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "Will be retrieved from Retry Message lambda environment variable",
  DYNAMO_URL: "Will be retrieved from Retry Message lambda environment variable"
}

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get MQ connection details")
  }

  dynamoConfig.DYNAMO_URL = retryLambda.Configuration?.Environment?.Variables?.AWS_URL || ""
  if (!dynamoConfig.DYNAMO_URL) {
    throw Error("Couldn't get DynamoDB URL")
  }

  dynamoConfig.TABLE_NAME = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_TABLE_NAME || ""
  if (!dynamoConfig.TABLE_NAME) {
    throw Error("Couldn't get DynamoDB table name")
  }
}

async function run() {
  const dynamo = new AwsAuditLogDynamoGateway(dynamoConfig, dynamoConfig.TABLE_NAME)

  try {
    for (const id of messageIds) {
      const result = await dynamo.fetchOne(id)
      if (isError(result)) {
        throw result
      }

      // const sortedEvents = result.events.sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? 1 : -1))

      if (result.events.filter((e) => e.eventSource === "ResubmitFailedPNCMessages").length > 20) {
        fs.writeFileSync(id.toString(), JSON.stringify(result))

        const fixedEvents = result.events.filter((e) => e.eventSource !== "ResubmitFailedPNCMessages")
        const fixedRecord = { ...result, events: fixedEvents }

        const updateResult = await dynamo.update(fixedRecord)

        if (isError(updateResult)) {
          throw updateResult
        }
        console.log(`Events removed ${id}`)
      } else {
        console.log("Nothing to remove for " + id.toString())
      }
    }
  } catch (error) {
    console.error(error)
  }
}

async function start() {
  await setup()
  await run()
}

start()
