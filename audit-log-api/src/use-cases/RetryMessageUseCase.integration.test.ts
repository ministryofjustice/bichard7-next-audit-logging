jest.setTimeout(15000)

import "shared-testing"
import { AuditLog, BichardAuditLogEvent, DynamoDbConfig, MqConfig, S3Config } from "shared-types"
import { AwsAuditLogDynamoGateway, encodeBase64 } from "shared"
import { TestDynamoGateway } from "shared"
import { AuditLogApiClient } from "shared"
import { TestStompitMqGateway } from "shared"
import { TestAwsS3Gateway } from "shared"
import RetryMessageUseCase from "./RetryMessageUseCase"
import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"

const dynamoDbConfig: DynamoDbConfig = {
  DYNAMO_URL: 'http://localhost:8000',
  DYNAMO_REGION: 'eu-west-2',
  AUDIT_LOG_TABLE_NAME: 'auditLogTable',
  AWS_ACCESS_KEY_ID: 'DUMMY',
  AWS_SECRET_ACCESS_KEY: 'DUMMY'
}
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(dynamoDbConfig, dynamoDbConfig.AUDIT_LOG_TABLE_NAME)
const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway)

const queueName = "retry-event-integration-testing"
const mqConfig: MqConfig = {
  url: 'stomp://localhost:51613',
  username: 'admin',
  password: 'admin'
}
const mqGateway = new TestStompitMqGateway(mqConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Config: S3Config = {
  url: 'http://localhost:4569',
  region: 'eu-west-2',
  bucketName: 'auditLogEventsBucket',
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER'
}
const s3Gateway = new TestAwsS3Gateway(s3Config)
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient('http://localhost:3000', "DUMMY")
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
    mqGateway.dispose()
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
