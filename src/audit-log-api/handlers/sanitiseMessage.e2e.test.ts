jest.setTimeout(15000)
import axios from "axios"
import { addDays } from "date-fns"
import { BichardPostgresGateway, createS3Config, HttpStatusCode, TestPostgresGateway, TestS3Gateway } from "src/shared"
import {
  createMockAuditLog,
  createMockAuditLogEvent,
  mockDynamoAuditLog,
  setEnvironmentVariables
} from "src/shared/testing"
import type { DynamoAuditLog, OutputApiAuditLog } from "src/shared/types"
import createBichardPostgresGatewayConfig from "../createBichardPostgresGatewayConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
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

const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const testPostgresGateway = new TestPostgresGateway(postgresConfig)
const errorListTestPostgresGateway = new TestPostgresGateway(errorListPostgresConfig)

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

  it("should fully sanitise message and return successfully", async () => {
    const s3Path = "message.xml"
    const message = (await createMockAuditLog({
      receivedDate: new Date("2020-01-01").toISOString(),
      s3Path
    })) as OutputApiAuditLog

    await createMockAuditLogEvent(message.messageId, {
      attributes: {
        "Trigger 2 Details": "TRPR0004",
        "Original Hearing Outcome / PNC Update Dataset": "<?xml><dummy></dummy>",
        OriginalHearingOutcome: "<?xml><dummy></dummy>",
        OriginalPNCUpdateDataset: "<?xml><dummy></dummy>",
        PNCUpdateDataset: "<?xml><dummy></dummy>",
        AmendedHearingOutcome: "<?xml><dummy></dummy>",
        AmendedPNCUpdateDataset: "<?xml><dummy></dummy>"
      }
    })

    await createMockAuditLogEvent(message.messageId)

    await messagesS3Gateway.upload(s3Path, "dummy")

    const otherMessageId = "otherMessageID"
    await testPostgresGateway.insertRecords([{ message_id: message.messageId }, { message_id: otherMessageId }])

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.noContent)

    const actualMessageS3Objects = await messagesS3Gateway.getAll()
    expect(actualMessageS3Objects).toEqual([])

    const actualMessage = (await auditLogDynamoGateway.fetchOne(message.messageId)) as DynamoAuditLog
    const triggerEvent = actualMessage.events.find((event) =>
      Object.keys(event.attributes ?? {}).includes("Trigger 2 Details")
    )
    const triggerEventAttributes = triggerEvent?.attributes ?? {}
    expect(Object.keys(triggerEventAttributes)).toHaveLength(1)
    expect(triggerEventAttributes["Trigger 2 Details"]).toBe("TRPR0004")

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

  it("should automatically delete sensitive attributes", async () => {
    const s3Path = "message.xml"
    const message = (await createMockAuditLog({
      receivedDate: new Date("2020-01-01").toISOString(),
      s3Path
    })) as OutputApiAuditLog

    await createMockAuditLogEvent(message.messageId, {
      attributes: {
        "Trigger 2 Details": "TRPR0004",
        sensitiveAttributes: "attr1,attr2",
        attr1: "to delete",
        attr2: "to delete"
      }
    })

    await messagesS3Gateway.upload(s3Path, "dummy")

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.noContent)

    const actualMessage = (await auditLogDynamoGateway.fetchOne(message.messageId)) as DynamoAuditLog
    const triggerEvent = actualMessage.events.find((event) =>
      Object.keys(event.attributes ?? {}).includes("Trigger 2 Details")
    )
    const triggerEventAttributes = triggerEvent?.attributes ?? {}
    expect(Object.keys(triggerEventAttributes)).toHaveLength(2)
    expect(triggerEventAttributes).toHaveProperty("Trigger 2 Details", "TRPR0004")
    expect(triggerEventAttributes).toHaveProperty("sensitiveAttributes", "attr1,attr2")
    expect(triggerEventAttributes).not.toHaveProperty("attr1")
    expect(triggerEventAttributes).not.toHaveProperty("attr2")
  })
})
