jest.setTimeout(15000)

import type { DynamoDbConfig, MqConfig, S3Config } from "shared-types"
import { AuditLogLookup } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { HttpStatusCode, TestDynamoGateway, TestAwsS3Gateway, TestStompitMqGateway } from "shared"
import axios from "axios"
import { v4 as uuid } from "uuid"
import { encodeBase64 } from "shared"

const auditLogDynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const auditLogLookupDynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogLookupTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const mqConfig: MqConfig = {
  url: "stomp://localhost:51613",
  username: "admin",
  password: "admin"
}

const testAuditLogDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const testAuditLogLookupDynamoGateway = new TestDynamoGateway(auditLogLookupDynamoConfig)
const s3Gateway = new TestAwsS3Gateway(s3Config)
const testMqGateway = new TestStompitMqGateway(mqConfig)

describe("retryMessage", () => {
  beforeEach(async () => {
    await testAuditLogDynamoGateway.deleteAll(auditLogDynamoConfig.TABLE_NAME, "messageId")
    await testAuditLogLookupDynamoGateway.deleteAll(auditLogLookupDynamoConfig.TABLE_NAME, "id")
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message contains eventXml and has been retried successfully", async () => {
    const eventXml = `<Xml>${uuid()}</Xml>`
    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    const lookupItem = new AuditLogLookup(eventXml, message.messageId)
    message.events.push(
      new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "RETRY_DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date(),
        eventXml: { valueLookup: lookupItem.id } as unknown as string
      })
    )

    await testAuditLogDynamoGateway.insertOne(auditLogDynamoConfig.TABLE_NAME, message, "messageId")
    await testAuditLogLookupDynamoGateway.insertOne(auditLogLookupDynamoConfig.TABLE_NAME, lookupItem, "id")

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/retry`, null)

    expect(response.data).toBe("")
    expect(response.status).toBe(HttpStatusCode.noContent)

    const msg = await testMqGateway.getMessage("RETRY_DUMMY_QUEUE")
    testMqGateway.dispose()
    expect(msg).toEqual(eventXml)
  })

  it("should return Ok status when message constains s3Path for the event and has been retried successfully", async () => {
    const eventXml = `<Xml>${uuid()}< /Xml>`
    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    const lookupItem = new AuditLogLookup(eventXml, message.messageId)
    const eventS3Path = "event.xml"
    const messageEvent = {
      s3Path: eventS3Path,
      ...new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "RETRY_DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date()
      })
    } as unknown as BichardAuditLogEvent
    message.events.push(messageEvent)

    const eventObjectInS3 = {
      messageData: encodeBase64(eventXml)
    }
    await s3Gateway.upload(eventS3Path, JSON.stringify(eventObjectInS3))

    await testAuditLogDynamoGateway.insertOne(auditLogDynamoConfig.TABLE_NAME, message, "messageId")
    await testAuditLogLookupDynamoGateway.insertOne(auditLogLookupDynamoConfig.TABLE_NAME, lookupItem, "id")

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/retry`, null)

    expect(response.status).toBe(HttpStatusCode.noContent)
    expect(response.data).toBe("")

    const msg = await testMqGateway.getMessage("RETRY_DUMMY_QUEUE")
    testMqGateway.dispose()
    expect(msg).toEqual(eventXml)
  })
})
