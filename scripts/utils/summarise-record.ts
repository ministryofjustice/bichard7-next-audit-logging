import { Lambda } from "aws-sdk"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../../src/audit-log-api/gateways/dynamo"
import { DynamoAuditLog, isError } from "../../src/shared/types"
import { AuditLogEventAttributes, DynamoAuditLogEvent } from "../../src/shared/types/AuditLogEvent"

const outDir = "pnc-status-debugging"

const WORKSPACE = process.env.WORKSPACE ?? "production"
let dynamo: AuditLogDynamoGateway | undefined

const dynamoConfig: DynamoDbConfig = {
  auditLogTableName: "Will be retrieved from Retry Message lambda environment variable",
  endpoint: "Will be retrieved from Retry Message lambda environment variable",
  eventsTableName: "Not needed",
  region: "eu-west-2"
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

  dynamoConfig.eventsTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_EVENTS_TABLE_NAME || ""
  if (!dynamoConfig.eventsTableName) {
    throw Error("Couldn't get DynamoDB events table name")
  }

  dynamo = new AuditLogDynamoGateway(dynamoConfig)
}

const triggerRegex = /Trigger \d+ Details/
const exceptionRegex = /Exception Type/

const getErrorsFromAttributes = (attributes: AuditLogEventAttributes, errorType?: RegExp): string[] => {
  return Object.entries(attributes).reduce((acc: string[], [key, value]) => {
    if (errorType) {
      if (key.match(errorType)) {
        acc.push(value.toString());
      }
    } return acc
  }, []);
}

const formatEvent = (event: DynamoAuditLogEvent): string => {
  const output: string[] = []
  output.push(`${event.timestamp} - ${event.eventType} (${event.eventSource})`)
  if (event.eventCode === "triggers.generated" && event.attributes) {
    output.push(`${" ".repeat(27)}${getErrorsFromAttributes(event.attributes, triggerRegex).sort().join(", ")}`)
  }
  if (event.eventCode === "triggers.locked") {
    output.push(`${" ".repeat(27)}User: ${event.user}`)
  }
  if (event.eventCode === "triggers.resolved" && event.attributes) {
    output.push(`${" ".repeat(27)}${getErrorsFromAttributes(event.attributes).sort().join(", ")}`)
    output.push(`${" ".repeat(27)}User: ${event.user}`)
  }
  if (event.eventCode === "exceptions.generated" && event.attributes) {
    output.push(`${" ".repeat(27)}${getErrorsFromAttributes(event.attributes, exceptionRegex).sort().join(", ")}`)
  }
  return output.join("\n")
}

const formatAuditLog = (auditLog: DynamoAuditLog): string => {
  const keys = [
    { messageId: "Bichard id" },
    { receivedDate: "Received at" },
    { systemId: "Sent from" },
    { caseId: "PTIURN" },
    { externalCorrelationId: "Exiss correlation id" },
    { externalId: "Source correlation id" },
    { pncStatus: "PNC Status" },
    { triggerStatus: "Trigger Status" }
  ]
  const output: string[] = []

  keys.forEach((key) => {
    const [index, name] = Object.entries(key)[0]
    output.push(`${name.padEnd(22)}: ${auditLog[index]}`)
  })
  output.push("\nEvents:\n")
  output.push(...auditLog.events.map(formatEvent))
  return output.join("\n")
}

const run = async () => {
  await setup()
  const messageId = process.argv[process.argv.length - 1]

  const record = await dynamo?.fetchOne(messageId)
  if (isError(record)) {
    throw record
  }
  if (record) {
    console.log(formatAuditLog(record))
  }
}

async function main() {
  await setup()
  await run()
}

main()
