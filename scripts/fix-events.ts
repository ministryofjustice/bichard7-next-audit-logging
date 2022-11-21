import { Lambda } from "aws-sdk"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
import fs from "fs"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../src/audit-log-api/gateways/dynamo"
import { AuditLogEvent, isError, PromiseResult } from "../src/shared/types"

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

const fetchBatch = async (lastItem?: AuditLogEvent): Promise<AuditLogEvent[]> => {
  const pagination = lastItem ? { ExclusiveStartKey: { _id: lastItem._id } } : {}
  const result = await dynamoGateway.client
    .scan({
      TableName: dynamoConfig.eventsTableName,
      ...pagination
    })
    .promise()

  if (isError(result)) {
    throw result
  }

  return result.Items as AuditLogEvent[]
}

const main = async (args) => {
  let count = 0
  await setup()

  let lastItem: AuditLogEvent | undefined
  let dynamoUpdates: DocumentClient.TransactWriteItem[] = []
  const updatePromises: PromiseResult<void>[] = []

  while (true) {
    const auditEvents = await fetchBatch(lastItem)
    count += auditEvents.length
    if (auditEvents.length === 0) {
      break
    }

    for (const event of auditEvents) {
      if (!event.eventCode) {
        // console.log(`Fixing: ${event._id}`)
        dynamoUpdates.push({
          Update: {
            TableName: dynamoConfig.eventsTableName,
            Key: {
              _id: event._id
            },
            UpdateExpression: "SET eventCode = :eventCode",
            ExpressionAttributeValues: { ":eventCode": "unknown" }
          }
        })

        if (dynamoUpdates.length >= 25) {
          updatePromises.push(dynamoGateway.executeTransaction(dynamoUpdates.slice(0, 25)))
          // updatePromises.push(Promise.resolve())
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
  // updatePromises.push(Promise.resolve())

  await Promise.all(updatePromises)
  console.log("Done.")
}

main(process.argv)
