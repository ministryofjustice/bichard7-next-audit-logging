/*
 * This script is to fix incoming message handler long running executions when Send to Bichard step output is null
 * When this happens:
 * - It is probable that the message has not been pushed to the MQ for Bichard to process,
 *  however, there still might be messages that have been pushed to MQ
 * - Record Sent to Bichard step fails to log event because lambda input is null

 * This script:
 * - Lists all running executions
 * - Filters the executions that have Send to Bichard step with empty or null output
 * - Checks audit log status to ensure that the message has not been processed by Bichard
 * - Invokes Send to Bichard lambda
 * - Invokes Record Sent to Bihcard lambda
 * - Stops the state machine execution
 */

import { DynamoDB, Lambda, StepFunctions } from "aws-sdk"
import { InvocationResponse } from "aws-sdk/clients/lambda"
import { ExecutionListItem } from "aws-sdk/clients/stepfunctions"
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs"

const stepFunctions = new StepFunctions({ region: "eu-west-2" })
const dynamoDb = new DynamoDB({ region: "eu-west-2" })
const lambda = new Lambda({ region: "eu-west-2" })

const logMessage = (message: string) => {
  const messageToLog = `${new Date().toISOString()} - ${message}`
  console.log(message)
  appendFileSync("fix-messages.log", messageToLog + "\n")
}

const processExecution = async (execution: StepFunctions.ExecutionListItem) => {
  logMessage(`Processing execution\n\t${execution.executionArn}`)

  let events: StepFunctions.HistoryEvent[] = []
  let nextToken: string | undefined
  while (true) {
    const history = await stepFunctions
      .getExecutionHistory({ executionArn: execution.executionArn, nextToken })
      .promise()
    nextToken = history.nextToken
    events = events.concat(history.events)

    if (history.events.length === 0 || !nextToken) {
      break
    }
  }

  const hasNullOutputAndShouldBeFixed = !!events.find(
    (x) =>
      (x.type === "TaskStateExited" &&
        x.stateExitedEventDetails?.name === "Send to Bichard" &&
        !x.stateExitedEventDetails?.output) ||
      x.stateExitedEventDetails?.output === "null"
  )

  if (!hasNullOutputAndShouldBeFixed) {
    logMessage("Send to Bichard lambda output has value. Skipping this execution.")
    return
  }

  logMessage("Send to Bichard lambda output was null. We need to fix this execution.")

  const sendToBichardInput = events.find(
    (x) => x.type === "TaskStateEntered" && x.stateEnteredEventDetails?.name === "Send to Bichard"
  )?.stateEnteredEventDetails?.input

  if (!sendToBichardInput) {
    logMessage("Couldn't find the input for Send to Bichard lambda. Cannot replay the execution.")
    return
  }
  const sendToBichardJsonInput = JSON.parse(sendToBichardInput)
  const messageId = sendToBichardJsonInput?.auditLog?.messageId

  if (!messageId) {
    logMessage("Invalid lambda input. Couldn't get messageId.")
    return
  }

  writeFileSync(`${messageId}_send-to-bichard_input.json`, JSON.stringify(sendToBichardJsonInput))

  logMessage("Found input for Send to Bichard lambda.")
  logMessage(`Checking message ${messageId}`)
  const auditLogRecord = await dynamoDb
    .getItem({ TableName: "bichard-7-production-audit-log", Key: { messageId: { S: messageId } } })
    .promise()
  const auditLogEvents = await dynamoDb
    .query({
      TableName: "bichard-7-production-audit-log-events",
      IndexName: "messageIdIndex",
      ExpressionAttributeValues: { ":messageId": { S: messageId } },
      ExpressionAttributeNames: { "#messageId": "_messageId" },
      KeyConditionExpression: "#messageId = :messageId"
    })
    .promise()

  let shouldSendToBichard = false
  // Check to ensure that the audit log has the initial statuses when created
  if (
    auditLogRecord.Item?.status?.S === "Processing" &&
    auditLogRecord.Item?.pncStatus?.S === "Processing" &&
    auditLogRecord.Item?.triggerStatus?.S === "NoTriggers" &&
    (auditLogEvents.Count === 0 ||
      auditLogEvents.Items?.filter((x) => x.eventCode.S !== "audit-log.duplicate-message")?.length === 0)
  ) {
    shouldSendToBichard = true
  } else {
    logMessage("It seems Bichard has processed the message. The message won't be send to Bichard for processing.")
  }

  logMessage("Audit log record indicates that the message has not been processed by Bichard.")

  let sendToBichardInvocationOutput: InvocationResponse
  const sendToBichardInvocationOutputFileName = `${messageId}_send-to-bichard_output.json`
  if (!existsSync(sendToBichardInvocationOutputFileName)) {
    if (!shouldSendToBichard) {
      logMessage(
        "This script has not invoked Send to Bichard lambda and the audit log status indicates that Bichard has processed the message. We need to fix this execution manually."
      )
      return
    }
    logMessage("Invoking Send to Bichard lambda")

    sendToBichardInvocationOutput = await lambda
      .invoke({
        FunctionName: "bichard-7-production-send-to-bichard",
        InvocationType: "RequestResponse",
        Payload: sendToBichardInput
      })
      .promise()
    writeFileSync(sendToBichardInvocationOutputFileName, JSON.stringify(sendToBichardInvocationOutput))
  } else {
    logMessage("Send to Bichard lambda has already been invoked. Retrieving the lambda output...")
    sendToBichardInvocationOutput = JSON.parse(
      readFileSync(sendToBichardInvocationOutputFileName).toString()
    ) as InvocationResponse
  }

  if (!sendToBichardInvocationOutput.Payload) {
    logMessage("Send to Bichard output is empty. Cannot invoke Record Sent to Bichard.")
    return
  }

  let recordSentToBichardInvocationOutput: InvocationResponse
  const recordSentToBichardInvocationOutputFileName = `${messageId}_record-sent-to-bichard_output.json`
  if (!existsSync(recordSentToBichardInvocationOutputFileName)) {
    logMessage("Invoking Record Sent to Bichard lambda")

    recordSentToBichardInvocationOutput = await lambda
      .invoke({
        FunctionName: "bichard-7-production-record-sent-to-bichard-event",
        InvocationType: "RequestResponse",
        Payload: sendToBichardInvocationOutput.Payload
      })
      .promise()
    writeFileSync(recordSentToBichardInvocationOutputFileName, JSON.stringify(recordSentToBichardInvocationOutput))
  } else {
    logMessage("Record Sent to Bichard lambda has already been invoked. Retrieving lambda output...")
    recordSentToBichardInvocationOutput = JSON.parse(
      readFileSync(recordSentToBichardInvocationOutputFileName).toString()
    ) as InvocationResponse
  }

  if (!recordSentToBichardInvocationOutput.Payload) {
    logMessage("Record Sent to Bichard output is empty. Manual check needed.")
    return
  }

  logMessage(`Stopping the state machine execution ${execution.executionArn}`)
  const stopExecutionResult = await stepFunctions.stopExecution({ executionArn: execution.executionArn }).promise()
  writeFileSync(`${messageId}_stop_execution.json`, JSON.stringify(stopExecutionResult))
}

const getRunningExecutions = async () => {
  const stateMachines = await stepFunctions.listStateMachines().promise()
  const incomingMessageHhandlerArn = stateMachines.stateMachines.find(
    (x) => x.name === "bichard-7-production-incoming-message-handler"
  )?.stateMachineArn
  let executions: ExecutionListItem[] = []
  let listExecutionsNextToken: string | undefined
  while (true) {
    const listExecutionsResult = await stepFunctions
      .listExecutions({
        stateMachineArn: incomingMessageHhandlerArn,
        statusFilter: "RUNNING",
        nextToken: listExecutionsNextToken
      })
      .promise()
    executions = executions.concat(listExecutionsResult.executions)
    listExecutionsNextToken = listExecutionsResult.nextToken

    if (!listExecutionsNextToken) {
      break
    }
  }

  return executions
}

const run = async () => {
  const executions = await getRunningExecutions()

  logMessage(`Found ${executions.length} running executions`)

  if (!process.env.EXECUTION_ARN) {
    for (let index = 0; index < executions.length; index++) {
      logMessage(`Execution ${index + 1} of ${executions.length}`)
      await processExecution(executions[index])
    }
  }

  const executionToProcess = executions.find((x) => x.executionArn === process.env.EXECUTION_ARN)
  if (!executionToProcess) {
    logMessage("Couldn't find the execition")
    return
  }
  logMessage("Found the execution. Processing...")
  await processExecution(executionToProcess)
}

run()
