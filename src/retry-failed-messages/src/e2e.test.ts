// jest.retryTimes(10)
import "shared-testing"
import { TestAwsS3Gateway, TestDynamoGateway, encodeBase64 } from "shared"
import { setEnvironmentVariables } from "shared-testing"
import type { DynamoDbConfig, S3Config } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { v4 as uuid } from "uuid"
setEnvironmentVariables()
process.env.MESSAGE_FORMAT = "AuditEvent"
process.env.BUCKET_NAME = "auditLogEventsBucket"
import handler from "./index"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
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

const dynamoGateway = new TestDynamoGateway(dynamoConfig)
const s3Gateway = new TestAwsS3Gateway(s3Config)

describe("Retry Failed Messages", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
    await dynamoGateway.deleteAll(dynamoConfig.TABLE_NAME, "messageId")
  })

  it("should retry the correct messages for the first time", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const event = {
      messageData: encodeBase64(messageXml),
      messageFormat: "Dummy Event Source",
      eventSourceArn: uuid(),
      eventSourceQueueName: "DUMMY_QUEUE"
    }

    const s3Path = "event.xml"
    await s3Gateway.upload(s3Path, JSON.stringify(event))

    const message = new AuditLog("External Correlation ID", new Date(Date.now() - 3_600_000), "dummy hash")
    message.status = "Error"
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

    await dynamoGateway.insertOne(dynamoConfig.TABLE_NAME, message, "messageId")

    const result = await handler()

    expect(result).toEqual({ retried: [message.messageId], errored: [] })
  })

  it("should handle errors retrying messages", async () => {
    const message = new AuditLog("External Correlation ID", new Date(Date.now() - 3_600_000), "dummy hash")
    message.status = "Error"
    message.events.push(
      new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date(),
        s3Path: "nonexistent.xml"
      })
    )

    await dynamoGateway.insertOne(dynamoConfig.TABLE_NAME, message, "messageId")

    const result = await handler()

    expect(result).toEqual({ retried: [], errored: [message.messageId] })
  })
})
