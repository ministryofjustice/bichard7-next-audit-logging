jest.setTimeout(50000)

import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"

const insertRecordsIntoBichardDB = () => {
  console.log("Insert records")
}

const createAuditLogMessage = () => {
  console.log("Create audit log message")
}

const invokeRecordErrorArchival = async (): Promise<void> => {
  const client = new LambdaClient({ region: "EU-WEST-2" })
  const command = new InvokeCommand({
    FunctionName: "LAMBDA_ARN"
  })
  const response = await client.send(command)
  expect(response.StatusCode).toBeBetween(200, 299)
}

const isArchivedLogGroupCompleted = (id: number): boolean => {
  return false
}

const areArchivedLogsCompleted = (groupId: number): boolean => {
  return false
}

const hasArchivalEvent = (messageId: string): boolean => {
  return false
}

it("Should update the audit log with archived errors", () => {
  // Setup
  insertRecordsIntoBichardDB()
  createAuditLogMessage()

  // Invoke lambda
  invokeRecordErrorArchival()

  // Check archive records have been updated
  expect(areArchivedLogsCompleted(0)).toBeTruthy()

  // Check archive group has been updated
  expect(isArchivedLogGroupCompleted(0)).toBeTruthy()

  // Check audit log contains events
  expect(hasArchivalEvent("")).toBeTruthy()
})
