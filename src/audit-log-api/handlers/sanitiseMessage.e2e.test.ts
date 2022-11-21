jest.setTimeout(15000)
import axios from "axios"
import { addDays } from "date-fns"
import { BichardPostgresGateway, createS3Config, HttpStatusCode, TestPostgresGateway, TestS3Gateway } from "src/shared"
import { mockDynamoAuditLog, setEnvironmentVariables } from "src/shared/testing"
import type { DynamoAuditLog } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
import createBichardPostgresGatewayConfig from "../createBichardPostgresGatewayConfig"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

setEnvironmentVariables()

const auditLogTableName = "auditLogTable"

const postgresConfig = createBichardPostgresGatewayConfig()
const errorListPostgresConfig = {
  ...postgresConfig,
  TABLE_NAME: postgresConfig.TABLE_NAME?.replace("archive_", "")
}
const postgresGateway = new BichardPostgresGateway(postgresConfig)

const messagesS3Gateway = new TestS3Gateway(createS3Config("INTERNAL_INCOMING_MESSAGES_BUCKET"))
const eventsS3Gateway = new TestS3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const testPostgresGateway = new TestPostgresGateway(postgresConfig)
const errorListTestPostgresGateway = new TestPostgresGateway(errorListPostgresConfig)

const createAuditLogEvent = (eventS3Path: string): AuditLogEvent => {
  const event = new AuditLogEvent({
    eventSourceQueueName: "dummy event source queue name",
    eventSource: "dummy event source",
    category: "information",
    eventType: "Hearing Outcome marked as resolved by user",
    timestamp: new Date()
  })
  event.addAttribute("Trigger 2 Details", "TRPR0004")
  event.addAttribute("Original Hearing Outcome / PNC Update Dataset", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalPNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("PNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedPNCUpdateDataset", "<?xml><dummy></dummy>")

  return { ...event, s3Path: eventS3Path } as unknown as AuditLogEvent
}

describe("sanitiseMessage", () => {
  beforeEach(async () => {
    await eventsS3Gateway.deleteAll()
    await messagesS3Gateway.deleteAll()
    await testDynamoGateway.deleteAll(auditLogTableName, "messageId")
    await testPostgresGateway.truncateTable()
    await errorListTestPostgresGateway.truncateTable()
  })

  afterAll(async () => {
    await testPostgresGateway.dispose()
    await errorListTestPostgresGateway.dispose()
    await postgresGateway.dispose()
  })

  it("should return Ok status when message has been sanitised successfully", async () => {
    const message = mockDynamoAuditLog({ receivedDate: new Date("2020-01-01").toISOString() })
    message.s3Path = "message.xml"
    const event1 = createAuditLogEvent("event1.xml") as AuditLogEvent & { s3Path: string }
    const event2 = new AuditLogEvent({
      eventSource: "dummy event source",
      category: "information",
      eventType: "dummy event type",
      timestamp: new Date()
    })
    message.events = [event1, event2]

    await messagesS3Gateway.upload(message.s3Path, "dummy")
    await eventsS3Gateway.upload(event1.s3Path, "dummy")

    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")

    const otherMessageId = "otherMessageID"
    const records = [
      { message_id: message.messageId },
      { message_id: message.messageId },
      { message_id: otherMessageId }
    ]
    await testPostgresGateway.insertRecords(records)

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.noContent)

    const actualMessageS3Objects = await messagesS3Gateway.getAll()
    expect(actualMessageS3Objects).toEqual([])

    const actualEventS3Objects = await eventsS3Gateway.getAll()
    expect(actualEventS3Objects).toEqual([])

    const actualMessage = await testDynamoGateway.getOne<DynamoAuditLog>(
      auditLogTableName,
      "messageId",
      message.messageId
    )

    const attributes = actualMessage?.events.find((event) => "s3Path" in event)?.attributes ?? {}
    expect(Object.keys(attributes)).toHaveLength(1)
    expect(attributes["Trigger 2 Details"]).toBe("TRPR0004")

    const allResults = await testPostgresGateway.findAll()
    expect(allResults).toHaveLength(1)
    expect(allResults?.[0]).toHaveProperty("message_id", otherMessageId)
  })

  it("should not sanitise if the message is under 90 days old", async () => {
    const expectedNextCheck = addDays(new Date(), 2).toISOString()
    const message = mockDynamoAuditLog()
    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")
    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })
    const actualMessage = await testDynamoGateway.getOne<DynamoAuditLog>(
      auditLogTableName,
      "messageId",
      message.messageId
    )

    expect(response.status).toBe(HttpStatusCode.ok)
    expect(response.data).toBe("Message not sanitised.")
    expect(actualMessage?.isSanitised).toBe(0)
    expect(actualMessage?.nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
  })

  it("should not sanitise if the message is in the error_list table", async () => {
    const expectedNextCheck = addDays(new Date(), 2).toISOString()
    const message = mockDynamoAuditLog({ receivedDate: new Date("2020-01-01").toISOString() })
    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")
    await errorListTestPostgresGateway.insertRecords([{ message_id: message.messageId }])
    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })
    const actualMessage = await testDynamoGateway.getOne<DynamoAuditLog>(
      auditLogTableName,
      "messageId",
      message.messageId
    )

    expect(response.status).toBe(HttpStatusCode.ok)
    expect(response.data).toBe("Message not sanitised.")
    expect(actualMessage?.isSanitised).toBe(0)
    expect(actualMessage?.nextSanitiseCheck).toContain(expectedNextCheck.split("T")[0])
  })

  it("should return Error when the message ID does not exist", async () => {
    const response = await axios.post(`http://localhost:3010/messages/IdNotExist/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.notFound)
  })
})
