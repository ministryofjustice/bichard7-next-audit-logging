jest.setTimeout(15000)

import axios from "axios"
import { encodeBase64, HttpStatusCode, TestMqGateway, TestS3Gateway } from "shared"
import { auditLogEventsS3Config } from "shared-testing"
import type { MqConfig } from "shared-types"
import { AuditLog, AuditLogLookup, BichardAuditLogEvent } from "shared-types"
import { v4 as uuid } from "uuid"
import { auditLogDynamoConfig, auditLogLookupDynamoConfig, TestDynamoGateway } from "../test"

const mqConfig: MqConfig = {
  url: "stomp://localhost:51613",
  username: "admin",
  password: "admin"
}

const testAuditLogDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const testAuditLogLookupDynamoGateway = new TestDynamoGateway(auditLogLookupDynamoConfig)
const s3Gateway = new TestS3Gateway(auditLogEventsS3Config)
const testMqGateway = new TestMqGateway(mqConfig)

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

  it("should return an error when retrying invalid messages", async () => {
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

    await testAuditLogDynamoGateway.insertOne(auditLogDynamoConfig.TABLE_NAME, message, "messageId")

    const { response } = await axios
      .post(`http://localhost:3010/messages/${message.messageId}/retry`, null)
      .catch((e) => e)

    expect(response.status).toBe(HttpStatusCode.internalServerError)
  })
})
