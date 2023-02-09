/*
 *
 * This script
 *    - gets messages from DynamoDB
 *    - Recalculates the statuses
 *    - Updates messages in DynamoDB if statuses are incorrect
 *
 * To recalculate and update one message:
 * WORKSPACE=<workspace> MESSAGE_ID=<message id> SESSION=<session name> aws-vault exec <profile> -- npx ts-node -T ./scripts/utils/recalculate-status.ts
 *
 * To recalculate and update multiple messages for a specific date range:
 * WORKSPACE=<workspace> START=<iso start date> END=<iso end date> SESSION=<session name> aws-vault exec <profile> -- npx ts-node -T ./scripts/utils/recalculate-status.ts
 *
 * Dry run is enabled by default, so no messages will be updated in DynamoDB.
 * You should set DRY_RUN=false in the command to update messages in DynamoDB.
 *
 * You can skip the DynamoDB update errors to prevent the script crashing and
 * keep the process running by setting SKIP_UPDATE_ERRORS=true in the command.
 * You can still view the error details in the log file.
 *
 * To see full log details in terminal, set LOG_LEVEL=verbose in the command.
 * It doesn't affect the log data stored in the log file.
 */

import { Lambda } from "aws-sdk"
import fs from "fs"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../../src/audit-log-api/gateways/dynamo"
import { DynamoAuditLog, isError, Result } from "../../src/shared/types"
import CalculateMessageStatusUseCase, {
  MessageStatus
} from "../../src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/CalculateMessageStatusUseCase"

const { MESSAGE_ID, SESSION, WORKSPACE, START, END, NUMBER_OF_CALCULATORS, SKIP_UPDATE_ERRORS, DRY_RUN, LOG_LEVEL } =
  process.env

if (!WORKSPACE) {
  console.error("WORKSPACE environment variable must have value")
  process.exit(1)
}

if ((!START && !END && !MESSAGE_ID) || ((START || END) && MESSAGE_ID)) {
  console.error("Either START/END or MESSAGE_ID environment variables must have value")
  process.exit(1)
}

if (!SESSION) {
  console.error("SESSION environment variable is missing. It is used to generate log file name.")
  process.exit(1)
}

const logFileName = `recalculate-status-${SESSION}.log`
const verboseLogLevel = String(LOG_LEVEL).toLowerCase() === "verbose"
const shouldSkipUpdateErrors = SKIP_UPDATE_ERRORS === "true"
const numberOfCalculators = parseInt(NUMBER_OF_CALCULATORS || "50", 10)

const dynamoConfig: DynamoDbConfig = {
  auditLogTableName: "Will be retrieved from Retry Message lambda environment variable",
  endpoint: "Will be retrieved from Retry Message lambda environment variable",
  eventsTableName: "Will be retrieved from Retry Message lambda environment variable",
  region: "eu-west-2"
}

function log(...params: unknown[]) {
  const logContent = [new Date().toISOString(), " - ", ...params]
  if (verboseLogLevel) {
    console.log(...logContent)
  }

  fs.appendFileSync(logFileName, logContent.join(" ") + "\r\n")
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

async function getMessage(dynamo: AuditLogDynamoGateway) {
  log(`Getting the message with ID ${MESSAGE_ID}`)
  const message = await dynamo.fetchOne(MESSAGE_ID!, {
    excludeColumns: [
      "events",
      "caseId",
      "events",
      "externalCorrelationId",
      "externalId",
      "forceOwner",
      "lastEventType",
      "s3Path",
      "systemId",
      "dummyKey"
    ],
    includeColumns: ["version"]
  })

  if (isError(message)) {
    throw message
  }

  if (!message) {
    throw Error("Message not found")
  }

  return [message]
}

async function findMessages(dynamo: AuditLogDynamoGateway) {
  log(`Getting messages for the period between ${START} and ${END}`)
  let lastMessage
  let allMessageIds: DynamoAuditLog[] = []

  while (true) {
    const messages = await dynamo.fetchRange({
      start: new Date(START!),
      end: new Date(END!),
      limit: 1000,
      lastMessage,
      excludeColumns: [
        "events",
        "caseId",
        "events",
        "externalCorrelationId",
        "externalId",
        "forceOwner",
        "lastEventType",
        "s3Path",
        "systemId",
        "dummyKey"
      ],
      includeColumns: ["version"]
    })

    if (isError(messages)) {
      throw messages
    }

    if (messages.length === 0) {
      return allMessageIds
    }

    lastMessage = messages[messages.length - 1]
    allMessageIds = allMessageIds.concat(messages)
  }
}

async function recalculateStatuses(dynamo: AuditLogDynamoGateway, messages: DynamoAuditLog[]) {
  log(`Recalculating statuses for ${messages.length} messages`)

  const updateQueue: [DynamoAuditLog, MessageStatus][] = []
  const totalMessages = messages.length
  let skipped = 0
  let updated = 0
  let failedUpdates = 0

  const isInProgress = () => messages.length > 0 || updateQueue.length > 0 || updated + skipped < totalMessages

  const reporter = async () => {
    while (isInProgress()) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
      console.log("\r\n\n\n")
      if (DRY_RUN !== "false") {
        console.log("**** Dry run is enabled. Messages will not be updated in DynamoDB\r\n")
      }

      console.log(
        `========= ${totalMessages - messages.length} / ${totalMessages} (${(
          100 -
          (messages.length / totalMessages) * 100
        ).toFixed(2)}%) =========`
      )
      console.log(`\tSkipped: ${skipped}`)
      console.log(`\tUpdated: ${updated} (${((updated / (updated + skipped)) * 100).toFixed(2)}%)`)
      if (failedUpdates > 0) {
        console.log(`\tFailed updates: ${failedUpdates}`)
      }
      console.log(`\tUpdate queue: ${updateQueue.length}`)
      console.log("\n\n\n")
    }
  }

  const statusCalculator = async () => {
    while (true) {
      let message = messages.shift()
      if (!message) {
        return
      }

      const events = await dynamo.getEvents(message.messageId)
      if (isError(events)) {
        throw Error(`Couldn't get events for message ${message.messageId}`)
      }

      const recalculatedStatus = new CalculateMessageStatusUseCase(events).call()

      if (
        message.pncStatus === recalculatedStatus.pncStatus &&
        message.triggerStatus === recalculatedStatus.triggerStatus &&
        message.status === recalculatedStatus.status
      ) {
        skipped++
        continue
      }

      log(`${message.messageId}: Requires update`)
      if (message.status !== recalculatedStatus.status) {
        log("\t", `Status: ${message.status} -> ${recalculatedStatus.status}`)
      }

      if (message.pncStatus !== recalculatedStatus.pncStatus) {
        log("\t", `PNC Status: ${message.pncStatus} -> ${recalculatedStatus.pncStatus}`)
      }

      if (message.triggerStatus !== recalculatedStatus.triggerStatus) {
        log("\t", `Trigger Status: ${message.triggerStatus} -> ${recalculatedStatus.triggerStatus}`)
      }

      updateQueue.push([message, recalculatedStatus])
    }
  }

  const statusUpdater = async () => {
    while (isInProgress()) {
      const updateItems = updateQueue.splice(0, 100) // DynamoDB supports up to 100 actions in a transaction
      if (updateItems.length === 0) {
        // Wait 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5_000))
        continue
      }

      const updateBatchResult = await Promise.all(
        updateItems.map(([message, recalculatedStatus]) =>
          dynamo.prepareUpdate(message, {
            status: recalculatedStatus.status,
            pncStatus: recalculatedStatus.pncStatus,
            triggerStatus: recalculatedStatus.triggerStatus
          })
        )
      )

      let updateBatch = updateBatchResult.flatMap((result: Result<[]>) => {
        if (isError(result)) {
          throw result
        }

        return result
      }) as []

      if (DRY_RUN === "false") {
        const updateResult = await dynamo.executeTransaction(updateBatch)
        if (isError(updateResult)) {
          log("Failed transaction details:\n", JSON.stringify(updateBatch, null, 2))

          if (!shouldSkipUpdateErrors) {
            throw updateResult
          }

          log(
            `${updateItems.length} messges failed to update:\r\n${updateItems
              .map((item) => item[0].messageId)
              .join("\r\n")}`
          )
          log(JSON.stringify(updateResult, null, 2))
          failedUpdates += updateItems.length
          updated += updateItems.length
          continue
        }
      }

      log(
        `${updateItems.length} messges updated${
          DRY_RUN !== "false" ? " (Dry run - Nothing updated)" : ""
        }:\r\n${updateItems.map((item) => item[0].messageId).join("\r\n")}`
      )
      updated += updateItems.length
    }
  }

  const workers = [...Array(numberOfCalculators).keys()].map(() => statusCalculator())
  workers.push(reporter())
  workers.push(statusUpdater())
  return Promise.all(workers)
}

async function start() {
  await setup()
  const dynamo = new AuditLogDynamoGateway(dynamoConfig)
  const messages = MESSAGE_ID ? await getMessage(dynamo) : await findMessages(dynamo)

  try {
    await recalculateStatuses(dynamo, messages)
  } catch (error) {
    log(JSON.stringify(error, null, 2))

    console.log("\r\n\nYou can set SKIP_UPDATE_ERRORS=true to skip errors and keep the process running.\r\n")
  }
}

start()
