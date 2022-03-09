jest.setTimeout(15000)

import type { DynamoDbConfig, MqConfig, S3Config } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { encodeBase64, HttpStatusCode, TestDynamoGateway, TestAwsS3Gateway, TestStompitMqGateway } from "shared"
import axios from "axios"
import { v4 as uuid } from "uuid"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  AUDIT_LOG_TABLE_NAME: "auditLogTable",
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

const testDynamoGateway = new TestDynamoGateway(dynamoConfig)
const s3Gateway = new TestAwsS3Gateway(s3Config)
const testMqGateway = new TestStompitMqGateway(mqConfig)

describe("retryMessage", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(dynamoConfig.AUDIT_LOG_TABLE_NAME, "messageId")
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message has been retried successfully", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const event = {
      messageData: encodeBase64(messageXml),
      messageFormat: "Dummy Event Source",
      eventSourceArn: uuid(),
      eventSourceQueueName: "RETRY_DUMMY_QUEUE"
    }

    const s3Path = "event.xml"
    await s3Gateway.upload(s3Path, JSON.stringify(event))

    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    message.events.push(
      new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "RETRY_DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date(),
        s3Path
      })
    )

    await testDynamoGateway.insertOne(dynamoConfig.AUDIT_LOG_TABLE_NAME, message, "messageId")

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/retry`, null)

    expect(response.status).toBe(HttpStatusCode.noContent)
    expect(response.data).toBe("")

    const msg = await testMqGateway.getMessage("RETRY_DUMMY_QUEUE")
    testMqGateway.dispose()
    expect(msg).toEqual(messageXml)
  })
})
