jest.retryTimes(10)
import "shared-testing"
import type { DynamoDbConfig, MqConfig, S3Config } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import {
  AwsAuditLogDynamoGateway,
  AwsAuditLogLookupDynamoGateway,
  TestDynamoGateway,
  AuditLogApiClient,
  TestStompitMqGateway,
  TestAwsS3Gateway
} from "shared"
import RetryMessageUseCase from "./RetryMessageUseCase"
import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"
import { AuditLogLookup } from "shared-types"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"
import { encodeBase64 } from "shared"

const dynamoDbConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "to be set in the test",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}
const auditLogTableName = "auditLogTable"
const auditLogLookupTableName = "auditLogLookupTable"
const testDynamoGateway = new TestDynamoGateway(dynamoDbConfig)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(dynamoDbConfig, auditLogTableName)
const auditLogLookupDynamoGateway = new AwsAuditLogLookupDynamoGateway(dynamoDbConfig, auditLogLookupTableName)
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupDynamoGateway)
const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway, lookupEventValuesUseCase)

const queueName = "retry-event-integration-testing"
const mqConfig: MqConfig = {
  url: "stomp://localhost:51613",
  username: "admin",
  password: "admin"
}
const mqGateway = new TestStompitMqGateway(mqConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}
const s3Gateway = new TestAwsS3Gateway(s3Config)
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient("http://localhost:3010", "DUMMY")
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const useCase = new RetryMessageUseCase(
  getLastEventUseCase,
  sendMessageToQueueUseCase,
  retrieveEventXmlFromS3UseCase,
  createRetryingEventUseCase
)

const eventXml = "Test Xml"

describe("RetryMessageUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogTableName, "messageId")
    await testDynamoGateway.deleteAll(auditLogLookupTableName, "id")
    await s3Gateway.createBucket(true)
    await s3Gateway.deleteAll()
  })

  afterAll(async () => {
    await mqGateway.dispose()
  })

  it("should retry message using eventXml field when last event is error", async () => {
    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    const auditLogLookupItem = new AuditLogLookup(eventXml, message.messageId)
    const event = new BichardAuditLogEvent({
      eventSource: "Dummy Event Source",
      eventSourceArn: "Dummy Event Arn",
      eventSourceQueueName: queueName,
      eventType: "Dummy Failed Message",
      category: "error",
      timestamp: new Date(),
      eventXml: { valueLookup: auditLogLookupItem.id } as unknown as string
    })
    message.events.push(event)

    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")
    await testDynamoGateway.insertOne(auditLogLookupTableName, auditLogLookupItem, "id")

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

  it("should retry message using event s3Path field when last event is error", async () => {
    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    const auditLogLookupItem = new AuditLogLookup(eventXml, message.messageId)
    const eventS3Path = "event.xml"
    const event = {
      s3Path: eventS3Path,
      ...new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: queueName,
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date()
      })
    } as unknown as BichardAuditLogEvent
    message.events.push(event)

    await s3Gateway.upload(eventS3Path, JSON.stringify({ messageData: encodeBase64(eventXml) }))
    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")
    await testDynamoGateway.insertOne(auditLogLookupTableName, auditLogLookupItem, "id")

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
