/*
 *
 * This script
 *    - get s3Path(s) of the message(s) from DynamoDB
 *    - retrieve the original message(s) content from S3
 *    - transform message(s) to the old format and replace the message IDs
 *    - Push the message(s) to COURT_RESULT_INPUT_QUEUE
 *
 * To push one message to the COURT_RESULT_INPUT queue:
 * WORKSPACE={WORKSPACE} MESSAGE_ID={MESSAGE_ID} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/rerun-messages.ts
 *
 * To push multiple messages to the queue using source file (each line in the file is a message ID):
 * WORKSPACE={WORKSPACE} SOURCE_FILE={SOURCE_FILE_PATH} aws-vault exec {ACCOUNT} -- npx ts-node -T ./scripts/rerun-messages.ts
 *
 */

import { Lambda, SSM } from "aws-sdk"
import fs from "fs"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../../src/audit-log-api/gateways/dynamo"
import transformMessageXml from "../../src/incoming-message-handler/use-cases/transformMessageXml"
import { MqGateway, S3Gateway } from "../../src/shared"
import { InputApiAuditLog, isError } from "../../src/shared/types"

const { SOURCE_FILE, MESSAGE_ID, SESSION, WORKSPACE } = process.env
if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}
if ((!SOURCE_FILE && !MESSAGE_ID) || (SOURCE_FILE && MESSAGE_ID)) {
  console.error("Either SOURCE_FILE or MESSAGE_ID environment variable must have value")
  process.exit(1)
}

if (!SESSION) {
  console.error(
    "SESSION environment variable is missing. It is used to keep track of the retried records and avoid rerunning them again"
  )
  process.exit(1)
}

const sessionReranFile = `${SESSION}_reran.log`
const sessionSkippedFile = `${SESSION}_skipped.log`
const sessionErrorFile = `${SESSION}_error.log`

const messageIds = MESSAGE_ID
  ? [MESSAGE_ID.trim()]
  : fs
      .readFileSync(SOURCE_FILE!)
      .toString()
      .split("\n")
      .filter((x) => !!x?.trim())
      .map((x) => x.trim())

const dynamoConfig: DynamoDbConfig = {
  auditLogTableName: "Will be retrieved from Retry Message lambda environment variable",
  endpoint: "Will be retrieved from Retry Message lambda environment variable",
  eventsTableName: "Not needed",
  region: "eu-west-2"
}

const s3Config = {
  bucketName: "Will be retrieved from Retry Message lambda environment variable",
  region: "eu-west-2",
  url: "Will be retrieved from Retry Message lambda environment variable"
}

const mqConfig = {
  username: "Will be retrieved from Retry Message lambda environment variable",
  password: "Will be retieved from SSM",
  url: "Will be retrieved from Retry Message lambda environment variable"
}

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get MQ connection details")
  }

  mqConfig.url = retryLambda.Configuration?.Environment?.Variables?.MQ_URL || ""
  if (!mqConfig.url) {
    throw Error("Couldn't get MQ URL")
  }

  mqConfig.username = retryLambda.Configuration?.Environment?.Variables?.MQ_USER || ""
  if (!mqConfig.username) {
    throw Error("Couldn't get MQ Username")
  }

  dynamoConfig.endpoint = retryLambda.Configuration?.Environment?.Variables?.AWS_URL || ""
  if (!dynamoConfig.endpoint) {
    throw Error("Couldn't get DynamoDB URL")
  }

  dynamoConfig.auditLogTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_TABLE_NAME || ""
  if (!dynamoConfig.auditLogTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }

  s3Config.bucketName = retryLambda.Configuration?.Environment?.Variables?.INTERNAL_INCOMING_MESSAGES_BUCKET || ""
  if (!s3Config.bucketName) {
    throw Error("Couldn't get S3 bucket name")
  }

  s3Config.url = retryLambda.Configuration?.Environment?.Variables?.S3_URL || ""
  if (!s3Config.url) {
    throw Error("Couldn't get S3 URL")
  }

  const ssm = new SSM()
  const mqPasswordResult = await ssm
    .getParameter({
      Name: `/cjse-${WORKSPACE}-bichard-7/mq/password`,
      WithDecryption: true
    })
    .promise()

  if (isError(mqPasswordResult)) {
    throw Error("Couldn't get MQ password")
  }

  mqConfig.password = mqPasswordResult.Parameter?.Value || ""
  if (!mqConfig.password) {
    throw Error("Retrieved MQ password is empty")
  }
}

async function rerunMessages() {
  const dynamo = new AuditLogDynamoGateway(dynamoConfig)
  const s3 = new S3Gateway(s3Config)
  const mq = new MqGateway(mqConfig)

  const processedMessages = fs.readFileSync(sessionReranFile).toString()
  // get s3 paths from ids
  for (const id of messageIds) {
    console.log(`Processing message: ${id}`)
    const result = await dynamo.fetchOne(id)

    if (isError(result)) {
      fs.appendFileSync(sessionErrorFile, `Dynamo error: ${id}\n`)
      throw result
    }

    if (
      result.events.some(
        (e) =>
          e.eventType === "PNC Update applied successfully" ||
          e.eventType.includes("added to Error List") ||
          e.eventType.includes("passed to Error List")
      )
    ) {
      console.log(`Message has been processed and PNC got updated: ${id}`)
      if (!processedMessages.includes(id)) {
        fs.appendFileSync(sessionReranFile, id + "\n")
      }
      continue
    } else if (processedMessages.includes(id)) {
      console.log(`Message already processed in this session: ${id}`)
      fs.appendFileSync(sessionSkippedFile, id + "\n")
      continue
    }

    const contentInNewFormat = await s3.getItem(result.s3Path)

    if (isError(contentInNewFormat)) {
      fs.appendFileSync(sessionErrorFile, `S3 error: ${id}\n`)
      throw contentInNewFormat
    }

    const contentInOldFormat = transformMessageXml({ messageId: id } as InputApiAuditLog, contentInNewFormat)

    const mqResult = await mq.execute(contentInOldFormat, "COURT_RESULT_INPUT_QUEUE")

    if (isError(mqResult)) {
      fs.appendFileSync(sessionErrorFile, `MQ error: ${id}\n`)
      throw mqResult
    }

    fs.appendFileSync(sessionReranFile, id + "\n")
    console.log(`Message pushed to the MQ: ${id}`)
  }
}

async function start() {
  await setup()
  await rerunMessages()
}

start()
