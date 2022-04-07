jest.setTimeout(15000)

import type { S3Config } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import { encodeBase64, HttpStatusCode, TestAwsS3Gateway } from "shared"
import axios from "axios"
import { v4 as uuid } from "uuid"

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const s3Gateway = new TestAwsS3Gateway(s3Config)

describe("sanitiseMessage", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message has been sanitised successfully", async () => {
    const messageXml = `<Xml>${uuid()}< /Xml>`
    const event = {
      messageData: encodeBase64(messageXml),
      messageFormat: "Dummy Event Source",
      eventSourceArn: uuid(),
      eventSourceQueueName: "SANITISE_DUMMY_QUEUE"
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

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null)

    expect(response.status).toBe(HttpStatusCode.ok)
    expect(response.data).toBe("")
  })
})
