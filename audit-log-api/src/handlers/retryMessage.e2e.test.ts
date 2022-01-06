jest.setTimeout(15000)

import fs from "fs"
import { AuditLog, BichardAuditLogEvent, HttpStatusCode } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import { setEnvironmentVariables } from "@bichard/testing-config"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import createS3Config from "src/createS3Config"
import { TestAwsS3Gateway } from "@bichard/s3"
import axios from "axios"

const environmentVariables = JSON.parse(fs.readFileSync(`./scripts/env-vars.json`).toString())
const apiUrl = String(environmentVariables.Variables.API_URL).replace("localstack_main", "localhost")
const apiKey = environmentVariables.Variables.API_KEY

setEnvironmentVariables({
  AUDIT_LOG_TABLE_NAME: "audit-log",
  AUDIT_LOG_EVENTS_BUCKET: "audit-log-events"
})

const dynamoDbConfig = createDynamoDbConfig()
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)
const s3Gateway = new TestAwsS3Gateway(createS3Config())

describe("retryMessage", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(dynamoDbConfig.AUDIT_LOG_TABLE_NAME, "messageId")
    await s3Gateway.createBucket(true)
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message has been retried successfully", async () => {
    const s3Path = "event.xml"
    await s3Gateway.upload(s3Path, "<Xml></Xml>")
    const message = new AuditLog("External Correlation ID", new Date(), "Xml")
    message.events.push(
      new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date(),
        s3Path
      })
    )

    await testDynamoGateway.insertOne(dynamoDbConfig.AUDIT_LOG_TABLE_NAME, message, "messageId")

    const response = await axios.post(`${apiUrl}/messages/${message.messageId}/retry`, null, {
      headers: { "X-API-KEY": apiKey }
    })

    expect(response.status).toBe(HttpStatusCode.ok)
    expect(response.data).toBe("")
  })

  it("should return error response when there is an error while retrying message", async () => {
    const response = await axios
      .post(`${apiUrl}/messages/INVALID_MESSAGE_ID/retry`, null, { headers: { "X-API-KEY": apiKey } })
      .catch((error) => error)

    expect(response.response).toBeDefined()

    const { response: actualResponse } = response
    expect(actualResponse.status).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.data).toBe("Error: Couldn't get events for message 'INVALID_MESSAGE_ID'.")
  })

  it("should return forbidden response code when API key is not present", async () => {
    const response = await axios.post(`${apiUrl}/messages/MESSAGE_ID/retry`).catch((error) => error)

    expect(response.response).toBeDefined()

    const { response: actualResponse } = response
    expect(actualResponse.status).toBe(HttpStatusCode.forbidden)
  })

  it("should return forbidden response code when API key is invalid", async () => {
    const response = await axios
      .post(`${apiUrl}/messages/MESSAGE_ID/retry`, null, { headers: { "X-API-KEY": "Invalid API key" } })
      .catch((error) => error)

    expect(response.response).toBeDefined()

    const { response: actualResponse } = response
    expect(actualResponse.status).toBe(HttpStatusCode.forbidden)
  })
})
