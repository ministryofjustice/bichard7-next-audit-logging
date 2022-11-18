import { Lambda } from "aws-sdk"
import fs from "fs"
import {
  AuditLogDynamoGateway,
  AwsAuditLogLookupDynamoGateway,
  DynamoDbConfig
} from "../src/audit-log-api/gateways/dynamo"
import { IndexSearcher } from "../src/audit-log-api/gateways/dynamo/DynamoGateway"
import LookupEventValuesUseCase from "../src/audit-log-api/use-cases/LookupEventValuesUseCase"
import migrateToNewStructure from "../src/audit-log-api/use-cases/migrateToNewStructure"
import { S3Gateway } from "../src/shared/S3Gateway"
import { DynamoAuditLog, isError, S3Config } from "../src/shared/types"

let dynamoConfig: DynamoDbConfig
let dynamoGateway: AuditLogDynamoGateway
let lookupUseCase: LookupEventValuesUseCase
let s3Gateway: S3Gateway

const { WORKSPACE } = process.env

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get MQ connection details")
  }

  const s3Config = { region: "eu-west-2" } as S3Config
  s3Config.bucketName = `bichard-7-${WORKSPACE}-audit-logging-events`

  s3Config.url = retryLambda.Configuration?.Environment?.Variables?.S3_URL || ""
  if (!s3Config.url) {
    throw Error("Couldn't get S3 URL")
  }

  s3Gateway = new S3Gateway(s3Config)

  dynamoConfig = { region: "eu-west-2" } as DynamoDbConfig
  dynamoConfig.endpoint = retryLambda.Configuration?.Environment?.Variables?.AWS_URL || ""
  if (!dynamoConfig.endpoint) {
    throw Error("Couldn't get DynamoDB URL")
  }

  dynamoConfig.auditLogTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_TABLE_NAME || ""
  if (!dynamoConfig.auditLogTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }

  dynamoConfig.lookupTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_LOOKUP_TABLE_NAME || ""
  if (!dynamoConfig.lookupTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }

  dynamoConfig.eventsTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_EVENTS_TABLE_NAME || ""
  if (!dynamoConfig.eventsTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }

  dynamoGateway = new AuditLogDynamoGateway(dynamoConfig as DynamoDbConfig)

  const lookupGateway = new AwsAuditLogLookupDynamoGateway(dynamoConfig as DynamoDbConfig, dynamoConfig.lookupTableName)
  lookupUseCase = new LookupEventValuesUseCase(lookupGateway)
}

const fetchRange = async (start: string, end: string, lastMessage?: any): Promise<DynamoAuditLog[]> => {
  const result = await new IndexSearcher<DynamoAuditLog[]>(
    dynamoGateway,
    dynamoConfig.auditLogTableName,
    dynamoGateway.auditLogTableKey
  )
    .useIndex(`receivedDateIndex`)
    .setIndexKeys("_", "_", "receivedDate")
    .setBetweenKey(start, end)
    .paginate(10000, lastMessage, true)
    .execute()

  if (isError(result)) {
    throw result
  }
  return result as DynamoAuditLog[]
}

const main = async (args) => {
  let count = 0
  await setup()
  if (args.length === 4) {
    const start = args[2]
    const end = args[3]
    let lastMessage: DynamoAuditLog | undefined
    while (true) {
      const auditLogs = await fetchRange(start, end, lastMessage)
      count += auditLogs.length
      if (auditLogs.length === 0) {
        return true
      }
      const updatePromises = auditLogs.map((auditLog) =>
        migrateToNewStructure(dynamoGateway, lookupUseCase, s3Gateway, auditLog).catch((e) => {
          fs.appendFileSync(`${WORKSPACE}-migration-errors.txt`, `${auditLog.messageId}\n`)
        })
      )
      await Promise.all(updatePromises)
      console.log(`${count} records processed`)
      console.log(auditLogs[0].messageId, auditLogs[0].receivedDate)

      lastMessage = auditLogs[auditLogs.length - 1]
    }
  } else if (args.length === 3) {
    const id = args[2]

    const result = await dynamoGateway.getOne(dynamoConfig.auditLogTableName, dynamoGateway.auditLogTableKey, id)
    if (isError(result)) {
      throw result
    }
    if (!result || !result.Item) {
      throw new Error("Record not found")
    }

    const auditLog = result.Item as DynamoAuditLog

    await migrateToNewStructure(dynamoGateway, lookupUseCase, s3Gateway, auditLog)
  } else {
    throw Error("Unsupported number of arguments!")
  }

  console.log("Migrated.")
}

main(process.argv)
