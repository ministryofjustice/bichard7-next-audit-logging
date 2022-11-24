import { Lambda } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import fs from "fs"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../src/audit-log-api/gateways/dynamo"
import { IndexSearcher } from "../src/audit-log-api/gateways/dynamo/DynamoGateway"
import { AuditLogEvent, DynamoAuditLogEvent, isError, PromiseResult } from "../src/shared/types"

let dynamoConfig: DynamoDbConfig
let dynamoGateway: AuditLogDynamoGateway

const { WORKSPACE } = process.env

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get MQ connection details")
  }

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
}

const fetchRange = async (start: string, end: string, lastItem?: AuditLogEvent): Promise<AuditLogEvent[]> => {
  const result = await new IndexSearcher<AuditLogEvent[]>(
    dynamoGateway,
    dynamoConfig.eventsTableName,
    dynamoGateway.eventsTableKey
  )
    .useIndex(`timestampIndex`)
    .setIndexKeys("_", "_", "timestamp")
    .setBetweenKey(start, end)
    .paginate(10000, lastItem, true)
    .execute()

  if (isError(result)) {
    throw result
  }

  return result as AuditLogEvent[]
}

const codeLookup = {
  "Message Sent to Bichard": "hearing-outcome.received-incoming",
  "Court Result Input Queue Failure": "failure.court-result-input",
  "Data Set PNC Update Queue Failure": "failure.data-set-pnc-update",
  "Hearing Outcome Input Queue Failure": "failure.hearing-outcome-input",
  "Hearing Outcome PNC Update Queue Failure": "failure.hearing-outcome-pnc-update",
  "PNC Update Request Queue Failure": "failure.pnc-update-request"
}

const getEventCode = (event: DynamoAuditLogEvent): string => codeLookup[event.eventType] ?? "unknown"

const main = async (args) => {
  let count = 0
  await setup()

  let lastItem: AuditLogEvent | undefined
  let dynamoUpdates: DocumentClient.TransactWriteItem[] = []
  const updatePromises: PromiseResult<void>[] = []

  if (args.length === 4) {
    const start = args[2]
    const end = args[3]

    while (true) {
      const auditEvents = await fetchRange(start, end, lastItem)
      count += auditEvents.length
      if (auditEvents.length === 0) {
        break
      }

      for (const event of auditEvents) {
        const newCode = getEventCode(event)
        if ((!event.eventCode || event.eventCode === "unknown") && newCode !== event.eventCode) {
          // console.log(`Fixing: ${event._id}`)
          dynamoUpdates.push({
            Update: {
              TableName: dynamoConfig.eventsTableName,
              Key: {
                _id: event._id
              },
              UpdateExpression: "SET eventCode = :eventCode",
              ExpressionAttributeValues: {
                ":eventCode": newCode
              }
            }
          })

          if (dynamoUpdates.length >= 25) {
            updatePromises.push(dynamoGateway.executeTransaction(dynamoUpdates.slice(0, 25)))
            dynamoUpdates = dynamoUpdates.slice(25)
          }
        }

        if (event.attributes) {
          Object.values(event.attributes).forEach((value: any) => {
            if (value === null) {
              fs.appendFileSync(`${WORKSPACE}-event-null-values.txt`, `${event._id}\n`)
            } else if (typeof value === "object" && "valueLookup" in value) {
              fs.appendFileSync(`${WORKSPACE}-event-lookup-values.txt`, `${event._id}\n`)
            }
          })
        } else {
          fs.appendFileSync(`${WORKSPACE}-event-no-attributes.txt`, `${event._id}\n`)
        }

        if (typeof event.eventXml === "object") {
          if ("valueLookup" in (event.eventXml as any)) {
            fs.appendFileSync(`${WORKSPACE}-event-lookup-values.txt`, `${event._id}\n`)
          }
        }

        lastItem = auditEvents[auditEvents.length - 1]
      }

      console.log(
        `${auditEvents[0].timestamp}: ${count} events processed\tDynamo Updates:${dynamoUpdates.length}\tUpdate promises:${updatePromises.length}`
      )
    }

    updatePromises.push(dynamoGateway.executeTransaction(dynamoUpdates))

    await Promise.all(updatePromises)
    console.log("Done.")
  } else {
    console.error("Unsupported number of arguments!")
  }
}

main(process.argv)
