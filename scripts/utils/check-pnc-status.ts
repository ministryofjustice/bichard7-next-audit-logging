import { Lambda } from "aws-sdk"
import fs from "fs"
import { AuditLogDynamoGateway } from "../../src/audit-log-api/gateways/dynamo"
import CalculateMessageStatusUseCase from "../../src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"
import { transformAuditLogEvent } from "../../src/audit-log-api/utils"
import type { AuditLog, PromiseResult } from "../../src/shared/types"
import { isError } from "../../src/shared/types"

const outDir = "pnc-status-debugging"

const { WORKSPACE } = process.env
if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}

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

const fetchAllRecords = async (dynamo: AuditLogDynamoGateway, start: Date, end: Date): PromiseResult<AuditLog[]> => {
  const output: AuditLog[] = []
  let lastMessage: AuditLog | undefined = undefined
  while (true) {
    const records = await dynamo.fetchRange({ start, end, lastMessage })
    if (isError(records)) {
      throw records
    }
    if (records.length === 0) {
      return output
    }
    lastMessage = records[records.length - 1]
    output.push(...records)
  }
}

const run = async () => {
  const dynamo = new AuditLogDynamoGateway(dynamoConfig, dynamoConfig.TABLE_NAME)
  const startTime = new Date(process.argv[2])
  const endTime = new Date(process.argv[3])

  await fs.promises.mkdir(outDir, { recursive: true })

  console.log(`Checking records between ${startTime.toISOString()} and ${endTime.toISOString()}`)

  const records = await fetchAllRecords(dynamo, startTime, endTime)
  if (isError(records)) {
    throw records
  }

  console.log(`${records.length} records retrieved`)

  const processingRecords = records
    .map((record) => {
      record.events = record.events.map(transformAuditLogEvent).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      return { ...record, ...new CalculateMessageStatusUseCase(record.events).call() }
    })
    .filter((record) => record.pncStatus === "Processing" && record.status !== "Error")
  console.log(`${processingRecords.length} records in processing state`)
  processingRecords.forEach((record) =>
    fs.writeFileSync(
      `${outDir}/${record.receivedDate.replace(":", "")}-${record.messageId}.json`,
      JSON.stringify(record, null, 2)
    )
  )
}

async function main() {
  await setup()
  await run()
}

main()
