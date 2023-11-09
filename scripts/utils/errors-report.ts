/*
 * This script creates a report for messages in Error status within a specified date range.
 * The report details the quantity of messages and their corresponding IDs based on various reasons for failure
 *
 * This script
 *    - gets messages with error status from DynamoDB
 *    - groups events and generates reports
 *
 * To run this script:
 * START=<optional start date> END=<optional end date> WORKSPACE=<workspace> aws-vault exec <profile> -- npx ts-node -T ./scripts/utils/errors-report.ts
 *
 * e.g.
 * START=2023-10-01 END=2023-11-01 WORKSPACE=production aws-vault exec qsolution-production -- npx ts-node -T ./scripts/utils/errors-report.ts
 */

import { Lambda } from "aws-sdk"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../../src/audit-log-api/gateways/dynamo"
import { DynamoAuditLog, isError } from "../../src/shared/types"

const { WORKSPACE } = process.env

if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}

const dynamoConfig: DynamoDbConfig = {
  auditLogTableName: "Will be retrieved from Retry Message lambda environment variable",
  endpoint: "Will be retrieved from Retry Message lambda environment variable",
  eventsTableName: "Will be retrieved from Retry Message lambda environment variable",
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
    throw Error("Couldn't get Audit Log DynamoDB table name")
  }

  dynamoConfig.eventsTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_EVENTS_TABLE_NAME || ""
  if (!dynamoConfig.eventsTableName) {
    throw Error("Couldn't get Audit Log Events DynamoDB table name")
  }
}

const getDateOnly = (date: string | Date) => (typeof date === "object" ? date.toISOString() : date).split("T")[0]

const filterByDate = (messages: DynamoAuditLog[], start: Date, end: Date) =>
  messages.filter((message) => {
    const receivedDate = new Date(message.receivedDate)
    return receivedDate >= start && receivedDate < end
  })

async function findMessages(dynamo: AuditLogDynamoGateway, start: Date, end: Date) {
  let lastMessage
  let allMessages: DynamoAuditLog[] = []

  while (true) {
    const messages = await dynamo.fetchByStatus("Error", {
      limit: 1000,
      lastMessage,
      includeColumns: ["version"]
    })

    if (isError(messages)) {
      throw messages
    }

    if (messages.length === 0) {
      return allMessages
    }

    lastMessage = messages[messages.length - 1]
    allMessages = allMessages.concat(filterByDate(messages, start, end))
  }
}

const filterArray = (messages: DynamoAuditLog[], filterFn: (message: DynamoAuditLog) => boolean) => {
  const filtered = messages.filter(filterFn)
  const remaining = messages.filter(
    (message) => !filtered.some((filteredMessage) => filteredMessage.messageId === message.messageId)
  )

  return { filtered, remaining }
}

const filterArchivedOrSanitised = (message: DynamoAuditLog) =>
  message.events.some((event) => event.eventCode === "error-record.archived" || event.eventCode === "sanitised")

const filterMessagesAppearedInUi = (message: DynamoAuditLog) =>
  message.events.some((event) => ["exceptions.generated", "triggers.generated"].includes(event.eventCode))

const filterCpMessages = (message: DynamoAuditLog) =>
  message.events.some(
    (event) =>
      (event.category === "error" && event.eventSourceQueueName === "COURT_RESULT_INPUT_QUEUE") ||
      event.attributes?.["Exception Message"] === "The XML Converter encountered an Error during message UnMarshalling"
  )

const filterMessagesThatAreBeingRetried = (message: DynamoAuditLog) =>
  message.events.some((event) => event.eventCode === "hearing-outcome-retrying")

const filterMessagesRejectedByPncUpdateProcessor = (message: DynamoAuditLog) =>
  message.events.some((event) => event.eventType === "Message Rejected by [PNCUpdateProcessorBean] MDB")

const filterMessagesRejectedByCourtResultBean = (message: DynamoAuditLog) =>
  message.events.some((event) => event.eventType === "Message Rejected by [CourtResultBean] MDB")

const filterMessagesRejectedByAmendedHearingOutcomeBean = (message: DynamoAuditLog) =>
  message.events.some((event) => event.eventType === "Message Rejected by [AmendedHearingOutcomeBean] MDB")

function filterMessages(messages: DynamoAuditLog[]) {
  const archivedOrSanitised = filterArray(messages, filterArchivedOrSanitised)
  const appearedInUi = filterArray(archivedOrSanitised.remaining, filterMessagesAppearedInUi)
  const cp = filterArray(appearedInUi.remaining, filterCpMessages)
  const retrying = filterArray(cp.remaining, filterMessagesThatAreBeingRetried)
  const rejectedByPncUpdateProcessor = filterArray(
    retrying.remaining,
    filterMessagesRejectedByPncUpdateProcessor
  )
  const rejectedByCourtResultBean = filterArray(
    rejectedByPncUpdateProcessor.remaining,
    filterMessagesRejectedByCourtResultBean
  )
  const rejectedByAmendedHearingOutcomeBean = filterArray(
    rejectedByCourtResultBean.remaining,
    filterMessagesRejectedByAmendedHearingOutcomeBean
  )

  return {
    archivedOrSanitised: archivedOrSanitised.filtered,
    appearedInUi: appearedInUi.filtered,
    cp: cp.filtered,
    retrying: retrying.filtered,
    rejectedByPncUpdateProcessor: rejectedByPncUpdateProcessor.filtered,
    rejectedByCourtResultBean: rejectedByCourtResultBean.filtered,
    rejectedByAmendedHearingOutcomeBean: rejectedByAmendedHearingOutcomeBean.filtered,
    remaining: rejectedByAmendedHearingOutcomeBean.remaining
  }
}

const getMessagesDetails = (messages: DynamoAuditLog[]) => {
  const result = messages.map((message) => {
    const errorEvents = message.events.filter((event) => event.category === "error")
    const lastEvent = errorEvents.slice(-1)[0]
    const lastExceptionMessage = lastEvent?.attributes?.["Exception Message"] as string
    const lastStackTrace = lastEvent?.attributes?.["Exception Stack Trace"]
      ?.toString()
      ?.substring(0, 150)
      .replace("\n", " ")

    return (
      `\t${message.messageId} [${getDateOnly(message.receivedDate)}] - ` +
      `Events: ${message.events.length}, ` +
      `Error events: ${errorEvents.length}, ` +
      `${errorEvents.length > 1 ? "First error" : "Error"} on: ${getDateOnly(errorEvents[0]?.timestamp)}, ` +
      (errorEvents.length > 1 ? `Last error on: ${getDateOnly(lastEvent?.timestamp)}` : "") +
      (lastExceptionMessage ? `\n\t\t${lastExceptionMessage}` : "") +
      (lastStackTrace ? `\n\t\t${lastStackTrace}...` : "")
    )
  })

  return result.length > 0 ? result.join("\n") : "\t--- No messages ---"
}

async function start() {
  await setup()
  const dynamo = new AuditLogDynamoGateway(dynamoConfig)
  const start = process.env.START ? new Date(process.env.START) : new Date(0)
  const end = process.env.END ? new Date(process.env.END) : new Date()

  try {
    console.log(`Messages with error status between ${getDateOnly(start)} and ${getDateOnly(end)}`)
    const messages = await findMessages(dynamo, start, end)
    const {
      archivedOrSanitised,
      appearedInUi,
      cp,
      retrying,
      rejectedByPncUpdateProcessor,
      rejectedByCourtResultBean,
      rejectedByAmendedHearingOutcomeBean,
      remaining
    } = filterMessages(messages)

    console.log("Total number of messages with error status:", messages.length)
    console.log("Messages that are archived or sanitised:", archivedOrSanitised.length)
    console.log("Messages that appeared in the UI (have triggers or exceptions):", appearedInUi.length)
    console.log(
      "Messages that did not appear in the UI (does not have triggers or exceptions):",
      messages.length - archivedOrSanitised.length - appearedInUi.length
    )
    console.log("Messages for CP report:", cp.length)
    console.log("Messages retried but still not resolved:", retrying.length)
    console.log("Messages rejected by PNC update processor:", rejectedByPncUpdateProcessor.length)
    console.log("Messages rejected by court result bean:", rejectedByCourtResultBean.length)
    console.log("Messages rejected by amended hearing outcome bean:", rejectedByAmendedHearingOutcomeBean.length)
    console.log("Other messages with error status:", remaining.length)

    console.log("\nMore details:")
    console.log("Messages retried but still not resolved:\n", getMessagesDetails(retrying))
    console.log("\nMessages rejected by PNC update processor:\n", getMessagesDetails(rejectedByPncUpdateProcessor))
    console.log("\nMessages rejected by court result bean:\n", getMessagesDetails(rejectedByCourtResultBean))
    console.log(
      "\nMessages rejected by amended hearing outcome bean:\n",
      getMessagesDetails(rejectedByAmendedHearingOutcomeBean)
    )
    console.log("\nOther messages with error status:\n", getMessagesDetails(remaining))
  } catch (error) {
    console.log(JSON.stringify(error, null, 2))
  }
}

start()
