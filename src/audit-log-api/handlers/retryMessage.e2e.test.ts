jest.setTimeout(15000)

import axios from "axios"
import { HttpStatusCode, TestMqGateway, TestS3Gateway } from "src/shared"
import { auditLogEventsS3Config, createMockAuditLog, createMockAuditLogEvent } from "src/shared/testing"
import type { MqConfig, OutputApiAuditLog } from "src/shared/types"
import { v4 as uuid } from "uuid"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

const mqConfig: MqConfig = {
  url: "stomp://localhost:51613",
  username: "admin",
  password: "admin"
}

const testAuditLogDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const s3Gateway = new TestS3Gateway(auditLogEventsS3Config)
const testMqGateway = new TestMqGateway(mqConfig)

describe("retryMessage", () => {
  beforeEach(async () => {
    await testAuditLogDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message contains eventXml and has been retried successfully", async () => {
    const eventXml = `<Xml>${uuid()}</Xml>`
    const message = (await createMockAuditLog()) as OutputApiAuditLog

    await createMockAuditLogEvent(message.messageId, {
      eventSource: "Dummy Event Source",
      eventSourceQueueName: "RETRY_DUMMY_QUEUE",
      eventType: "Dummy Failed Message",
      category: "error",
      eventXml
    })

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/retry`, null)

    expect(response.data).toBe("")
    expect(response.status).toBe(HttpStatusCode.noContent)

    const msg = await testMqGateway.getMessage("RETRY_DUMMY_QUEUE")
    testMqGateway.dispose()
    expect(msg).toEqual(eventXml)
  })
})
