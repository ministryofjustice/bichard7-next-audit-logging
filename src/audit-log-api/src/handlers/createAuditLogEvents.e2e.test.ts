jest.retryTimes(10)
import axios from "axios"
import type { AuditLog, DynamoDbConfig, BichardAuditLogEvent } from "shared-types"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { mockAuditLog, mockAuditLogEvent } from "shared-testing"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

describe("Creating Audit Log events", () => {
  const gateway = new TestDynamoGateway(dynamoConfig)

  beforeEach(async () => {
    await gateway.deleteAll(dynamoConfig.TABLE_NAME, "messageId")
  })

  it("should create a single new audit log event for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, [event])
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(dynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as BichardAuditLogEvent
    expect(actualEvent.attributes?.["Attribute 1"]).toHaveProperty("valueLookup")

    actualEvent.attributes["Attribute 1"] = event.attributes["Attribute 1"]
    expect(actualEvent.eventXml).toHaveProperty("valueLookup")
    expect({ ...actualEvent, eventXml: undefined }).toEqual({ ...event, eventXml: undefined })
  })

  it("should create many new audit log events for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const events = new Array(10).fill(0).map(() => mockAuditLogEvent())
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, events)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(dynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events: dynamoEvents } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(dynamoEvents).toHaveLength(10)
    dynamoEvents.forEach((event) => {
      const actualEvent = event as BichardAuditLogEvent
      expect(actualEvent.attributes?.["Attribute 1"]).toHaveProperty("valueLookup")

      actualEvent.attributes["Attribute 1"] = event.attributes["Attribute 1"]
      expect(actualEvent.eventXml).toHaveProperty("valueLookup")
      expect({ ...actualEvent, eventXml: undefined }).toEqual({ ...event, eventXml: undefined })
    })
  })
})
