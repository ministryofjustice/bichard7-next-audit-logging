jest.setTimeout(15000)

import fs from "fs"
import { setEnvironmentVariables } from "shared-testing"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { AwsAuditLogDynamoGateway, encodeBase64 } from "shared"
import { TestDynamoGateway } from "shared"
import { AuditLogApiClient } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import createS3Config from "src/createS3Config"
import { createMqConfig, TestStompitMqGateway } from "shared"
import { TestAwsS3Gateway } from "shared"
import RetryMessageUseCase from "./RetryMessageUseCase"
import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"

const environmentVariables = JSON.parse(fs.readFileSync(`./scripts/env-vars.json`).toString())
const apiUrl = String(environmentVariables.Variables.API_URL).replace("localstack_main", "localhost")
const apiKey = environmentVariables.Variables.API_KEY

setEnvironmentVariables({
  API_URL: apiUrl,
  API_KEY: apiKey,
  AUDIT_LOG_TABLE_NAME: "audit-log",
  AUDIT_LOG_EVENTS_BUCKET: "audit-log-events"
})

const dynamoDbConfig = createDynamoDbConfig()
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(dynamoDbConfig, dynamoDbConfig.AUDIT_LOG_TABLE_NAME)
const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway)

const queueName = "retry-event-integration-testing"
const mqConfig = createMqConfig()
const mqGateway = new TestStompitMqGateway(mqConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Gateway = new TestAwsS3Gateway(createS3Config())
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient(apiUrl, apiKey)
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const useCase = new RetryMessageUseCase(
  getLastEventUseCase,
  sendMessageToQueueUseCase,
  retrieveEventXmlFromS3UseCase,
  createRetryingEventUseCase
)

const eventXml = "Test Xml"
const eventXmlFileName = "test-file.xml"

describe("RetryMessageUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(dynamoDbConfig.AUDIT_LOG_TABLE_NAME, "messageId")
    await s3Gateway.createBucket(true)
    await s3Gateway.deleteAll()
  })

  afterAll(async () => {
    await mqGateway.dispose()
  })

  it("should retry message when last event is error", async () => {
    const event = {
      messageData: encodeBase64(eventXml),
      messageFormat: "Dummy Event Source",
      eventSourceArn: "Dummy Event Arn",
      eventSourceQueueName: queueName
    }

    await s3Gateway.upload(eventXmlFileName, JSON.stringify(event))

    const message = new AuditLog("External Correlation ID", new Date(), "Xml")
    message.events.push(
      new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: queueName,
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date(),
        s3Path: eventXmlFileName
      })
    )

    await testDynamoGateway.insertOne(dynamoDbConfig.AUDIT_LOG_TABLE_NAME, message, "messageId")

    const result = await useCase.retry(message.messageId)

    expect(result).toNotBeError()

    const mqMessage = await mqGateway.getMessage(queueName)

    expect(mqMessage).toBe(eventXml)

    const actualAuditLogRecordResult = await auditLogDynamoGateway.fetchOne(message.messageId)

    expect(actualAuditLogRecordResult).toNotBeError()
    expect(actualAuditLogRecordResult).toBeDefined()

    const actualAuditLogRecord = <AuditLog>actualAuditLogRecordResult
    expect(actualAuditLogRecord.status).toBe("Retrying")

    const retryingEvents = actualAuditLogRecord.events.filter((x) => x.eventType === "Retrying failed message")
    expect(retryingEvents).toBeDefined()
    expect(retryingEvents).toHaveLength(1)
  })
})
