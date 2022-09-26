// jest.retryTimes(10)
import "shared-testing"
import { TestAwsS3Gateway, TestDynamoGateway, encodeBase64 } from "shared"
import { setEnvironmentVariables, auditLogDynamoConfig } from "shared-testing"
import type { S3Config } from "shared-types"
import { AuditLogLookup } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { v4 as uuid } from "uuid"
setEnvironmentVariables()
process.env.MESSAGE_FORMAT = "AuditEvent"
process.env.BUCKET_NAME = "auditLogEventsBucket"
import handler from "./index"

const auditLogTableName = "auditLogTable"
const auditLogLookupTableName = "auditLogLookupTable"

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const dynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const s3Gateway = new TestAwsS3Gateway(s3Config)

describe("Retry Failed Messages", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
    await dynamoGateway.deleteAll(auditLogTableName, "messageId")
    await dynamoGateway.deleteAll(auditLogLookupTableName, "id")
  })

  it("should retry the correct messages using eventXml for the first time", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const message = new AuditLog("External Correlation ID", new Date(Date.now() - 3_600_000), "dummy hash")
    message.status = "Error"

    const lookupItem = new AuditLogLookup(messageXml, message.messageId)
    const auditLogEvent = new BichardAuditLogEvent({
      eventSource: "Dummy Event Source",
      eventSourceArn: "Dummy Event Arn",
      eventSourceQueueName: "DUMMY_QUEUE",
      eventType: "Dummy Failed Message",
      category: "error",
      timestamp: new Date(),
      eventXml: { valueLookup: lookupItem.id } as unknown as string
    })
    message.events.push(auditLogEvent)

    await dynamoGateway.insertOne(auditLogTableName, message, "messageId")
    await dynamoGateway.insertOne(auditLogLookupTableName, lookupItem, "id")

    const result = await handler()

    expect(result).toEqual({ retried: [message.messageId], errored: [] })
  })

  it("should retry the correct messages using s3Path for the first time", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const event = {
      messageData: encodeBase64(messageXml),
      messageFormat: "Dummy Event Source",
      eventSourceArn: uuid(),
      eventSourceQueueName: "DUMMY_QUEUE"
    }

    const s3Path = "event.xml"
    await s3Gateway.upload(s3Path, JSON.stringify(event))

    const auditLogEvent = {
      s3Path,
      ...new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date()
      })
    } as unknown as BichardAuditLogEvent
    const message = new AuditLog("External Correlation ID", new Date(Date.now() - 3_600_000), "dummy hash")
    message.status = "Error"
    message.events.push(auditLogEvent)

    await dynamoGateway.insertOne(auditLogTableName, message, "messageId")

    const result = await handler()

    expect(result).toEqual({ retried: [message.messageId], errored: [] })
  })

  it("should handle errors retrying messages", async () => {
    const auditLogEvent = {
      s3Path: "nonexistent.xml",
      ...new BichardAuditLogEvent({
        eventSource: "Dummy Event Source",
        eventSourceArn: "Dummy Event Arn",
        eventSourceQueueName: "DUMMY_QUEUE",
        eventType: "Dummy Failed Message",
        category: "error",
        timestamp: new Date()
      })
    } as unknown as BichardAuditLogEvent
    const message = new AuditLog("External Correlation ID", new Date(Date.now() - 3_600_000), "dummy hash")
    message.status = "Error"
    message.events.push(auditLogEvent)

    await dynamoGateway.insertOne(auditLogTableName, message, "messageId")

    const result = await handler()

    expect(result).toEqual({ retried: [], errored: [message.messageId] })
  })
})
