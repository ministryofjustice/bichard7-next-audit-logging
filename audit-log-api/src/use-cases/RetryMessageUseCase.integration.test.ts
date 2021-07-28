jest.setTimeout(15000)

import "@bichard/testing-jest"
import fs from "fs"
import type { DynamoDbConfig } from "shared"
import { AuditLog, BichardAuditLogEvent, AwsAuditLogDynamoGateway } from "shared"
import TestDynamoGateway from "shared/dist/DynamoGateway/TestDynamoGateway"
import * as Mq from "@bichard/mq"
import * as S3 from "@bichard/s3"
import { AuditLogApiClient } from "@bichard/api-client"
import RetryMessageUseCase from "./RetryMessageUseCase"
import GetLastEventUseCase from "./GetLastEventUseCase"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"

const awsUrl = "http://localhost:4566"
const environmentVariables = JSON.parse(fs.readFileSync(`./scripts/env-vars.json`).toString())
const apiUrl = String(environmentVariables.Variables.API_URL).replace("localstack_main", "localhost")

const dynamoDbConfig: DynamoDbConfig = {
  DYNAMO_URL: awsUrl,
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(dynamoDbConfig, dynamoDbConfig.AUDIT_LOG_TABLE_NAME)
const getLastEventUseCase = new GetLastEventUseCase(auditLogDynamoGateway)

const queueName = "retry-event-integration-testing"
const mqConfig: Mq.MqConfig = {
  url: "failover:(stomp://localhost:51613)",
  username: "admin",
  password: "admin"
}
const mqGateway = new Mq.TestStompitMqGateway(mqConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Config: S3.S3Config = {
  url: awsUrl,
  region: "us-east-1",
  bucketName: "audit-log-events"
}
const s3Gateway = new S3.TestAwsS3Gateway(s3Config)
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient(apiUrl)
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
    await s3Gateway.upload(eventXmlFileName, eventXml)

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
