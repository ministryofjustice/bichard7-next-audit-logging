import { AuditLogApiClient, encodeBase64, TestMqGateway, TestS3Gateway } from "src/shared"
import "src/shared/testing"
import { auditLogEventsS3Config, mockDynamoAuditLog } from "src/shared/testing"
import type { DynamoAuditLog, MqConfig } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import CreateRetryingEventUseCase from "./CreateRetryingEventUseCase"
import RetrieveEventXmlFromS3UseCase from "./RetrieveEventXmlFromS3UseCase"
import RetryMessageUseCase from "./RetryMessageUseCase"
import SendMessageToQueueUseCase from "./SendMessageToQueueUseCase"

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)

const queueName = "retry-event-integration-testing"
const mqConfig: MqConfig = {
  url: "stomp://localhost:51613",
  username: "admin",
  password: "admin"
}
const mqGateway = new TestMqGateway(mqConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Gateway = new TestS3Gateway(auditLogEventsS3Config)
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient("http://localhost:3010", "DUMMY")
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const useCase = new RetryMessageUseCase(
  sendMessageToQueueUseCase,
  retrieveEventXmlFromS3UseCase,
  createRetryingEventUseCase
)

const eventXml = "Test Xml"

describe("RetryMessageUseCase", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
    await s3Gateway.createBucket(true)
    await s3Gateway.deleteAll()
  })

  afterAll(async () => {
    await mqGateway.dispose()
  })

  it("should retry message using eventXml field when last event is error", async () => {
    const message = mockDynamoAuditLog()
    const event = new AuditLogEvent({
      eventSource: "Dummy Event Source",
      eventSourceQueueName: queueName,
      eventType: "Dummy Failed Message",
      category: "error",
      timestamp: new Date(),
      eventXml
    })
    message.events.push(event)

    await testDynamoGateway.insertOne(auditLogDynamoConfig.auditLogTableName, message, "messageId")

    const result = await useCase.retry(message.messageId)

    expect(result).toNotBeError()

    const mqMessage = await mqGateway.getMessage(queueName)
    mqGateway.dispose()
    expect(mqMessage).toBe(eventXml)

    const actualAuditLogRecordResult = await auditLogDynamoGateway.fetchOne(message.messageId)

    expect(actualAuditLogRecordResult).toNotBeError()
    expect(actualAuditLogRecordResult).toBeDefined()

    const actualAuditLogRecord = <DynamoAuditLog>actualAuditLogRecordResult
    expect(actualAuditLogRecord.status).toBe("Retrying")

    const retryingEvents = actualAuditLogRecord.events.filter((x) => x.eventType === "Retrying failed message")
    expect(retryingEvents).toBeDefined()
    expect(retryingEvents).toHaveLength(1)
  })

  it("should retry message using event s3Path field when last event is error", async () => {
    const message = mockDynamoAuditLog()
    const eventS3Path = "event.xml"
    const event = {
      s3Path: eventS3Path,
      ...new AuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceQueueName: queueName,
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date()
      })
    } as unknown as AuditLogEvent
    message.events.push(event)

    await s3Gateway.upload(eventS3Path, JSON.stringify({ messageData: encodeBase64(eventXml) }))
    await testDynamoGateway.insertOne(auditLogDynamoConfig.auditLogTableName, message, "messageId")

    const result = await useCase.retry(message.messageId)

    expect(result).toNotBeError()

    const mqMessage = await mqGateway.getMessage(queueName)
    mqGateway.dispose()
    expect(mqMessage).toBe(eventXml)

    const actualAuditLogRecordResult = await auditLogDynamoGateway.fetchOne(message.messageId)

    expect(actualAuditLogRecordResult).toNotBeError()
    expect(actualAuditLogRecordResult).toBeDefined()

    const actualAuditLogRecord = <DynamoAuditLog>actualAuditLogRecordResult
    expect(actualAuditLogRecord.status).toBe("Retrying")

    const retryingEvents = actualAuditLogRecord.events.filter((x) => x.eventType === "Retrying failed message")
    expect(retryingEvents).toBeDefined()
    expect(retryingEvents).toHaveLength(1)
  })
})
